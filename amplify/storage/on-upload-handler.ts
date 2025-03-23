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

const DOCUMENT_TABLE_NAME = process.env.DOCUMENT_TABLENAME;

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
      if (resultJson.evaluation) {
        evaluationScore = resultJson.evaluation.score || 0;
        evaluationIssues = JSON.stringify(resultJson.evaluation.issues || []);
      }
      
      correctedText = resultJson.corrected_text || '';
    } catch (e) {
      console.error('JSON解析エラー:', e);
      // JSONでない場合は元のテキストをそのまま使用
    }
    
    // DynamoDBの更新パラメータ
    const updateParams = {
      TableName: DOCUMENT_TABLE_NAME,
      Key: {
        id: documentId
      },
      // 予約語である"status"をExpressionAttributeNamesで置き換え
      UpdateExpression: "set evaluationScore = :es, evaluationIssues = :ei, correctedText = :ct, analysisResult = :ar, #docStatus = :st",
      ExpressionAttributeNames: {
        "#docStatus": "status"
      },
      ExpressionAttributeValues: {
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
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `以下の利用規約を評価し、問題点や気をつける点を教えてください。
    評価対象は提示された文書ファイルのみとし、推測や文書外の情報は使用しないでください。
    回答は一般の利用者に親しみやすい口調で行い、具体的かつ分かりやすい説明を心がけてください。
    各問題点については該当箇所（条項番号と具体的文章）を文書から必ず引用してください。
    以下の観点に基づき問題点を特定してください。ただし、文章の難解さ自体は評価対象に含めません。この評価は利用者向けの説明であり、サービス提供者への改善提案ではありません。
    
    ### 評価観点
    #### A. 住居関連（金融面に着目）
    - **中途解約違約金**: 契約期間中の解約時に請求される金額や条件（例: 残り期間の何割が請求されるか）。
    - **更新料の発生条件と金額**: 自動発生する更新料の計算方法や発生タイミング。
    - **原状回復費用の算定基準**: 通常使用による劣化と故意・過失の境界に関する記述。
    - **滞納時の遅延損害金の利率**: 高利率設定（例: 年率14.6%など）が記載されているか。
    - **共益費・管理費の値上げ条件**: 曖昧な値上げ権限（例: 「必要に応じて」など）の記述。
    - **保証会社の利用強制と手数料**: 契約時および更新時に発生する手数料内容。
    - **鍵紛失時の交換費用**: 鍵や防犯システム全体の交換に関する費用負担。
    
    #### B. 通信・サブスクリプション関連
    - **海外ローミング料金の自動適用条件**: 意図せず接続しても課金対象となる条件。
    - **データ上限到達後の追加料金**: 自動で高額な追加パケット購入に切り替わる仕組み。
    - **キャンペーン終了後の通常料金への自動移行**: 割引期間終了後に料金が跳ね上がる条件。
    - **解約手続きの期限と違約金**: 解約申請締切日を過ぎた場合の請求内容。
    - **最低利用期間内の解約に伴う端末残債一括請求**: 分割払いが一括請求に切り替わる条件。
    - **通信速度制限の具体的条件**: 「公平な通信環境維持」など名目で制限される条件。
    
    #### C. AI関連サブスクリプション
    - **個人情報の国際移転**: データ保管国やEU域外への移転に伴う法的適用条件。
    - **入力データの利用範囲**: モデル学習への利用、匿名化程度や範囲。
    - **プラン自動更新と料金改定**: 事前通知なしで値上げされる条件や自動更新仕組み。
    - **API利用量の計測基準**: トークン数やリクエスト数カウント方法、超過時課金ルール。
    - **無料枠から有料枠への自動切替条件**: 利用量超過時に自動で有料プランへ移行する条件。
    
    #### D. 金融関連
    ##### 学生ローン・奨学金
    - **返済猶予・減額申請期限**: 申請遅延で猶予が適用されない条件。
    - **繰上返済手数料**: 一部繰上返済時に発生する手数料体系。
    
    ##### 学生クレジットカード
    - **リボ払い・分割払い自動設定**: 知らないうちにリボ払いへ変更される可能性。
    - **海外利用時為替手数料**: 表示レート以外に追加手数料が上乗せされる条件。
    - **キャッシング利用時金利**: 高金利設定（例: 年率18～20%など）。
    - **年会費無料継続条件**: 最低利用回数や利用金額設定。
    
    ### 評価結果フォーマット
    以下のJSONフォーマットで回答してください。JSON以外を出力しないでください:
    
    {
      "evaluation": {
        "score": 点数（0〜100）,
        "issues": [
          {
            "issue": "問題点について簡潔な説明",
            "suggestion": "該当箇所を引用符で囲んで引用し、問題点の詳細の説明"
          }
        ]
      },
      "corrected_text": "この文書ファイル全体について総合評価"
    }
    
    ### 注意事項
    1. 評価は提示された文書内容のみを基準とし、推測や外部情報は使用しないこと。
    2. 問題点は具体的かつ明確に記述し、該当箇所を引用すること。
    3. 利用者が理解しやすい親しみやすい口調で説明すること。`
    

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
      ], "generationConfig": { "response_mime_type": "application/json" }
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
        const chunks: Buffer[] = [];
        const decoder = new TextDecoder('utf-8');

        res.on('data', (chunk) => {
          // バイナリデータとしてchunkを蓄積
          chunks.push(Buffer.from(chunk));
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              // すべてのチャンクを連結してから一度にデコード
              const buffer = Buffer.concat(chunks);
              const data = decoder.decode(buffer);
              
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`JSONの解析に失敗しました: ${e}`));
            }
          } else {
            // エラーの場合もデコードを正しく行う
            const buffer = Buffer.concat(chunks);
            const data = decoder.decode(buffer);
            
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
        console.log(`分析結果: ${analysisResult}`);

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


