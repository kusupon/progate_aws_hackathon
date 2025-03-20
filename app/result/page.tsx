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
    return <p>問題点はありません。</p>;
  }

  return (
    <div className="evaluation-issues">
      <h3>指摘された問題点</h3>
      <ul>
        {issues.map((issue, index) => (
          <li key={index} className="issue-item">
            <div className="issue-problem">
              <strong>問題点:</strong> {issue.issue}
            </div>
            <div className="issue-suggestion">
              <strong>修正提案:</strong> {issue.suggestion}
            </div>
          </li>
        ))}
      </ul>
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
          <p className="loading">読み込み中...</p>
        ) : fileName ? (
          <div className="file-info">
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
            
            {/* 文字起こし結果と評価結果の表示 */}
            {documentData && documentData.originalText && (
              <div className="analysis-results">
                <h2>分析結果</h2>
                
                {documentData.evaluationScore !== undefined && (
                  <div className="evaluation-score">
                    <h3>評価スコア</h3>
                    <div 
                      className="score" 
                      style={{ color: getScoreColor(documentData.evaluationScore) }}
                    >
                      {documentData.evaluationScore} / 100
                    </div>
                  </div>
                )}
                
                <div className="text-comparison">
                  <div className="original-text">
                    <h3>原文</h3>
                    <div className="text-content">
                      {documentData.originalText}
                    </div>
                  </div>
                  
                  {documentData.correctedText && (
                    <div className="corrected-text">
                      <h3>修正後の文章</h3>
                      <div className="text-content">
                        {documentData.correctedText}
                      </div>
                    </div>
                  )}
                </div>
                
                <EvaluationIssues issues={evaluationIssues} />
              </div>
            )}
            
            {documentData && !documentData.originalText && documentData.status === "分析中" && (
              <p className="analysis-message">現在、このファイルの分析を実行中です。しばらくしてからリロードしてください。</p>
            )}
            
            {documentData && !documentData.originalText && documentData.status !== "分析中" && (
              <p className="analysis-message">このファイルの分析結果はまだありません。</p>
            )}
          </div>
        ) : (
          <p className="no-file">ファイル情報が見つかりません。</p>
        )}
      </div>
    </div>
  );
};

export default Result;
