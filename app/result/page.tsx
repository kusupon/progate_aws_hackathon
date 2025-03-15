"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "../../styles/app.css";
import { getUrl } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const Result = () => {
  const { authStatus, user } = useAuthenticator((context) => [context.authStatus, context.user]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
        
        // S3からファイルのURLを取得
        if (document.data.key) {
          const { url } = await getUrl({
            key: document.data.key,
            options: {
              expiresIn: 3600 // 1時間有効なURL
            }
          });
          
          setFileUrl(url.toString());
        }
      }
    } catch (error) {
      console.error("ドキュメントデータの取得に失敗しました", error);
    } finally {
      setIsLoading(false);
    }
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
            
            <p className="analysis-message">このファイルの分析結果はこちらに表示されます。</p>
          </div>
        ) : (
          <p className="no-file">ファイル情報が見つかりません。</p>
        )}
      </div>
    </div>
  );
};

export default Result;
