"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "../../styles/app.css";
import { getUrl } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

// 評価の問題点を表示するコンポーネント
const EvaluationIssues = ({ issues }: { issues: any[] }) => {
  if (!issues || issues.length === 0) {
    return <p className="no-issues">問題点はありません。</p>;
  }

  return (
    <div className="evaluation-issues">
      <h3>指摘された問題点</h3>
      <div className="issues-container">
        {issues.map((issue, index) => (
          <div key={index} className="issue-card">
            <div className="issue-problem">
              <h4>問題点</h4>
              <p>{issue.issue}</p>
            </div>
            <div className="issue-suggestion">
              <h4>修正提案</h4>
              <p>{issue.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Result = () => {
  const { authStatus, user } = useAuthenticator((context) => [context.authStatus, context.user]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evaluationIssues, setEvaluationIssues] = useState<any[]>([]);
  
  // データクライアントの生成
  const client = generateClient<Schema>();

  useEffect(() => {
    // 認証されていない場合はホームページにリダイレクト
    if (authStatus !== "authenticated") {
      router.push("/");
      return;
    }
    
    // URLパラメータからファイル名とドキュメントIDを取得
    const fileNameParam = searchParams.get("fileName");
    const idParam = searchParams.get("id");
    
    if (fileNameParam) {
      setFileName(decodeURIComponent(fileNameParam));
    }
    
    if (idParam) {
      setDocumentId(idParam);
      fetchDocumentData(idParam);
    } else {
      setIsLoading(false);
    }
  }, [authStatus, router, searchParams]);
  
  // ドキュメントデータを取得
  const fetchDocumentData = async (id: string) => {
    try {
      // データベースからドキュメント情報を取得
      const document = await client.models.Document.get({ id });
      
      if (document && document.data) {
        setDocumentData(document.data);
        
        // 評価の問題点を解析
        if (document.data.evaluationIssues) {
          try {
            const issues = JSON.parse(document.data.evaluationIssues);
            setEvaluationIssues(issues);
          } catch (e) {
            console.error("評価の問題点の解析に失敗しました", e);
          }
        }
        
        // S3からファイルのURLを取得
        if (document.data.key) {
          const result = await getUrl({
            path: document.data.key,
            options: {
              expiresIn: 3600 // 1時間有効なURL
            }
          });
          
          setFileUrl(result.url.toString());
        }
      }
    } catch (error) {
      console.error("ドキュメントデータの取得に失敗しました", error);
    } finally {
      setIsLoading(false);
    }
  };

  // スコアに基づいて色を決定
  const getScoreColor = (score: number) => {
    if (score >= 80) return "green";
    if (score >= 60) return "orange";
    return "red";
  };

  return (
    <div className="container">
      <div className="header">
        <h1>文書分析結果</h1>
        <div className="header-buttons">
          <Link href="/"><button className="btn btn-primary">ホームに戻る</button></Link>
        </div>
      </div>
      
      <div className="result-section">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">読み込み中...</p>
          </div>
        ) : fileName ? (
          <div className="file-info-card">
            <h2>ファイル情報</h2>
            <div className="file-name-display">
              <span className="label">ファイル名:</span>
              <span className="value">{fileName}</span>
            </div>
            
            {documentData && (
              <div className="file-details">
                <div className="detail-item">
                  <span className="label">アップロード日:</span>
                  <span className="value">{new Date(documentData.uploadDate).toLocaleString('ja-JP')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">ファイルサイズ:</span>
                  <span className="value">{Math.round(documentData.size / 1024)} KB</span>
                </div>
                <div className="detail-item">
                  <span className="label">ステータス:</span>
                  <span className={`value status-${documentData.status.replace(/\s+/g, '-')}`}>{documentData.status}</span>
                </div>
              </div>
            )}
            
            {fileUrl && (
              <div className="file-actions">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  ファイルを表示
                </a>
              </div>
            )}
            
            {/* 分析結果の表示 */}
            {documentData && (
              <div className="analysis-results">
                <h2>分析結果</h2>
                
                {documentData.evaluationScore !== undefined && (
                  <div className="evaluation-score-card">
                    <h3>評価スコア</h3>
                    <div 
                      className="score-display" 
                      style={{ color: getScoreColor(documentData.evaluationScore) }}
                    >
                      <span className="score-value">{documentData.evaluationScore}</span>
                      <span className="score-max">/ 100</span>
                    </div>
                  </div>
                )}
                
                {documentData.correctedText && (
                  <div className="corrected-text-card">
                    <h3>総合評価</h3>
                    <div className="text-content">
                      {documentData.correctedText}
                    </div>
                  </div>
                )}
                
                <EvaluationIssues issues={evaluationIssues} />
              </div>
            )}
            
            {documentData && documentData.status === "分析中" && (
              <div className="analysis-message">
                <div className="processing-icon"></div>
                <p>現在、このファイルの分析を実行中です。しばらくしてからリロードしてください。</p>
              </div>
            )}
            
            {documentData && documentData.status !== "分析中" && evaluationIssues.length === 0 && !documentData.correctedText && (
              <div className="analysis-message">
                <p>このファイルの分析結果はまだありません。</p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-file-card">
            <div className="no-file-icon"></div>
            <p>ファイル情報が見つかりません。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;
