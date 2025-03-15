"use client";

import Link from "next/link";
import "../styles/app.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function App() {
  const { user, signOut } = useAuthenticator();
  const userName = user.signInDetails?.loginId?.split('@')[0];
  const router = useRouter();
  
  // 文書アップロード用の状態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // ダミーデータ(あとで消す)
  const [uploadedDocuments, setUploadedDocuments] = useState([
    { id: 1, name: "報告書.pdf", date: "2023-03-10", status: "問題なし" },
    { id: 2, name: "契約書.docx", date: "2023-03-05", status: "要確認" },
    { id: 3, name: "議事録.pdf", date: "2023-02-28", status: "問題あり" }
  ]);

  // ファイル選択ハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // アップロードハンドラー（実際の処理は未実装）
  const handleUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // ここに実際のアップロード処理を実装する予定
    setTimeout(() => {
      // ダミーの処理：
      const newDocument = {
        id: uploadedDocuments.length + 1,
        name: selectedFile.name,
        date: new Date().toISOString().split('T')[0],
        status: "分析中"
      };
      
      setUploadedDocuments([newDocument, ...uploadedDocuments]);
      setSelectedFile(null);
      setIsUploading(false);
      
      // アップロード完了後、result.tsxに遷移
      router.push(`/result?fileName=${encodeURIComponent(selectedFile.name)}`);
    }, 1500);
  };

  return (
    <main className="container">
      <div className="header">
        <h1>ようこそ{userName}さん</h1>
        <div className="header-buttons">
          <button onClick={signOut} className="btn btn-secondary">ログアウト</button>
        </div>
      </div>
      
      <div className="upload-section">
        <h2>文書をアップロード</h2>
        <p>文書ファイルをアップロードして問題点を分析します</p>
        
        <div className="file-upload">
          <input 
            type="file" 
            id="document-upload" 
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
          />
          <label htmlFor="document-upload" className="file-label">
            {selectedFile ? selectedFile.name : "ファイルを選択"}
          </label>
          
          <button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="btn btn-upload"
          >
            {isUploading ? "アップロード中..." : "アップロード"}
          </button>
        </div>
      </div>
      
      <div className="documents-section">
        <h2>アップロード済み文書</h2>
        
        {uploadedDocuments.length === 0 ? (
          <p className="no-documents">アップロードされた文書はありません</p>
        ) : (
          <div className="documents-list">
            <div className="document-header">
              <span className="document-name">ファイル名</span>
              <span className="document-date">アップロード日</span>
              <span className="document-status">ステータス</span>
              <span className="document-action">操作</span>
            </div>
            
            {uploadedDocuments.map(doc => (
              <div key={doc.id} className={`document-item status-${doc.status.replace(/\s+/g, '-')}`}>
                <span className="document-name">{doc.name}</span>
                <span className="document-date">{doc.date}</span>
                <span className="document-status">{doc.status}</span>
                <span className="document-action">
                  <Link href={`/result?fileName=${encodeURIComponent(doc.name)}`}>
                    <button className="btn btn-small">詳細</button>
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
