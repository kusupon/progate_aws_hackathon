import type { S3Handler, S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Readable } from 'stream';
import * as https from 'https';
import { URL } from 'url';
// クライアントの初期化
const s3Client = new S3Client();
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DOCUMENT_TABLE_NAME = process.env.DOCUMENTTABLE_NAME;

// S3からファイルを取得し、Bufferに変換する関数
async function getFileFromS3(bucket: string, key: string): Promise<Buffer> {
  try {
    console.log(`S3からファイルを取得します: ${bucket}/${key}`);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error('ファイルの本文がありません');
    }

    const stream = response.Body as Readable;
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  } catch (error) {
    console.error('S3からのファイル取得エラー:', error);
    throw error;
  }
}

// S3オブジェクトのメタデータを取得する関数
async function getS3ObjectMetadata(bucket: string, key: string): Promise<Record<string, string> | null> {
  try {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    
    if (response.Metadata) {
      return response.Metadata;
    } else {
      return null;
    }
  } catch (error) {
    console.error('S3メタデータの取得エラー:', error);
    return null;
  }
}

// S3のキーからドキュメントIDを抽出する関数
async function extractDocumentId(bucket: string, objectKey: string): Promise<string | null> {
  try {
    // まず、S3オブジェクトのメタデータを取得してdocumentIdを探す
    const metadata = await getS3ObjectMetadata(bucket, objectKey);
    
    if (metadata && metadata.documentid) {
      const documentId = metadata.documentid;
      console.log(`メタデータからドキュメントIDを抽出しました: ${documentId}`);
      return documentId;
    }
    
    // メタデータからドキュメントIDが取得できない場合、従来の方法でキーからIDを抽出
    console.log(`メタデータにドキュメントIDがないため、S3キーから抽出を試みます`);
    
    // まず、タイムスタンプを抽出
    const timestampMatch = objectKey.match(/\/(\d+)_/);
    if (timestampMatch && timestampMatch[1]) {
      const timestamp = timestampMatch[1];
      console.log(`タイムスタンプを抽出しました: ${timestamp}`);
      return timestamp;
    }
    
    // ユーザーIDを抽出（フォールバック）
    const userIdMatch = objectKey.match(/private\/([^\/]+)\//);
    if (userIdMatch && userIdMatch[1]) {
      const userId = userIdMatch[1];
      console.log(`警告: フォールバックとしてユーザーID ${userId} を使用します`);
      return userId;
    }
    
    throw new Error(`S3キーからIDを抽出できませんでした: ${objectKey}`);
  } catch (error) {
    console.error(`ドキュメントIDの抽出エラー: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// 分析結果をDynamoDBに保存する関数
async function saveAnalysisResult(documentId: string, analysisResult: any): Promise<void> {
  try {
    console.log(`分析結果をドキュメントID ${documentId} に保存します`);
    
    // 分析結果からフィールドを抽出
    let originalText = '';
    let evaluationScore = 0;
    let evaluationIssues = '';
    let correctedText = '';
    
    try {
      // 文字列をクリーンアップ（JSON解析エラー対応）
      let cleanResult = analysisResult;
      if (typeof cleanResult === 'string') {
        // マークダウンのコードブロック（```json ... ```）を削除
        cleanResult = cleanResult.replace(/```json\s*|\s*```/g, '');
        
        // 先頭の「json」という文字があれば削除
        cleanResult = cleanResult.replace(/^json\s*/, '');
        
        // バッククォートを削除
        cleanResult = cleanResult.replace(/^`+|`+$/g, '');
      }
      
      // JSONの文字列として解析
      let resultJson;
      if (typeof cleanResult === 'string') {
        // 文字列の場合はJSONとしてパース
        resultJson = JSON.parse(cleanResult);
      } else {
        // すでにオブジェクトの場合はそのまま使用
        resultJson = cleanResult;
      }
      
      // フィールドを取得
      originalText = resultJson.original_text || '';
      
      if (resultJson.evaluation) {
        evaluationScore = resultJson.evaluation.score || 0;
        evaluationIssues = JSON.stringify(resultJson.evaluation.issues || []);
      }
      
      correctedText = resultJson.corrected_text || '';
    } catch (e) {
      console.error('JSON解析エラー:', e);
      // JSONでない場合は元のテキストをそのまま使用
      if (typeof analysisResult === 'string') {
        originalText = analysisResult;
      } else {
        originalText = JSON.stringify(analysisResult);
      }
    }
    
    // DynamoDBの更新パラメータ
    const updateParams = {
      TableName: DOCUMENT_TABLE_NAME,
      Key: {
        id: documentId
      },
      // 予約語である"status"をExpressionAttributeNamesで置き換え
      UpdateExpression: "set originalText = :ot, evaluationScore = :es, evaluationIssues = :ei, correctedText = :ct, analysisResult = :ar, #docStatus = :st",
      ExpressionAttributeNames: {
        "#docStatus": "status"
      },
      ExpressionAttributeValues: {
        ":ot": originalText,
        ":es": evaluationScore,
        ":ei": evaluationIssues,
        ":ct": correctedText,
        ":ar": typeof analysisResult === 'string' ? analysisResult : JSON.stringify(analysisResult),
        ":st": "完了"
      },
      ReturnValues: "UPDATED_NEW" as const
    };
    
    const command = new UpdateCommand(updateParams);
    await docClient.send(command);
    
    console.log(`ドキュメントID ${documentId} の分析結果を保存しました`);
  } catch (error) {
    console.error(`分析結果の保存に失敗しました: ${documentId}`, error);
    throw error;
  }
}

async function transcribeWithGemini(base64Data: string, mimeType: string): Promise<string> {
  try {
    // APIキーを使用
    const apiKey = GEMINI_API_KEY;

    // Gemini APIのエンドポイントURL
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `以下の文章を評価し、問題点を指摘した上で修正してください。
評価基準は以下の通りです：

誤字脱字や文法ミスの有無

表現の自然さ・読みやすさ

論理構成や文脈の適切さ

評価結果は100点満点で採点してください。
最終的な出力は必ず以下のJSONフォーマットに従ってください:

{
  "original_text": "元の文章（文字起こし結果）",
  "evaluation": {
    "score": 点数（0〜100の整数）,
    "issues": [
      {
        "issue": "問題点の簡潔な説明",
        "suggestion": "修正提案"
      },
      ...
    ]
  },
  "corrected_text": "修正後の文章"
}`;

    // APIリクエストのボディ
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    // Node.jsのhttpsモジュールを使用してAPIリクエストを送信
    const result = await new Promise<any>((resolve, reject) => {
      const url = new URL(apiUrl);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`JSONの解析に失敗しました: ${e}`));
            }
          } else {
            reject(new Error(`API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      // リクエストボディの送信
      req.write(JSON.stringify(requestBody));
      req.end();
    });
    
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      const responseText = result.candidates[0].content.parts[0].text;
      return responseText;
    } else {
      throw new Error('Gemini APIからの応答形式が予想と異なります');
    }
  } catch (error) {
    console.error('Gemini APIエラー:', error);
    throw error;
  }
}

// ファイル拡張子からMIMEタイプを決定する関数
function determineMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  try {
    const objectKeys = event.Records.map((record) => record.s3.object.key);
    console.log(`アップロードハンドラーが呼び出されました。対象ファイル: [${objectKeys.join(', ')}]`);

    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`処理中のファイル: ${objectKey}`);

      try {
        // S3からファイルを取得
        const fileData = await getFileFromS3(bucketName, objectKey);

        // Base64エンコード
        const base64Data = fileData.toString('base64');

        // ファイルのMIMEタイプを決定（ファイル拡張子から推測）
        const mimeType = determineMimeType(objectKey);

        // ドキュメントIDを抽出（バケット名とオブジェクトキーから）
        const documentId = await extractDocumentId(bucketName, objectKey);
        if (!documentId) {
          console.error(`ドキュメントIDを抽出できませんでした: ${objectKey}`);
          continue;
        }

        // Gemini APIで文字起こし実行
        console.log(`ドキュメントID ${documentId} の分析処理を開始します`);
        const analysisResult = await transcribeWithGemini(base64Data, mimeType);

        // DynamoDBに結果を保存
        await saveAnalysisResult(documentId, analysisResult);
        console.log(`ドキュメントID ${documentId} の処理が完了しました`);

      } catch (error) {
        console.error(`ファイル処理中にエラーが発生しました: ${objectKey}`, error);
      }
    }

    console.log('すべてのファイル処理が完了しました');
  } catch (error: unknown) {
    console.error('エラー発生:', error instanceof Error ? error.message : String(error));
  }
};
