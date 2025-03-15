"use client";

import "../styles/app.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

import Header from "./components/Header";
import UploadForm from "./components/UploadForm";
import DocumentList from "./components/DocumentList";

export default function App() {
  const { user } = useAuthenticator();
  const userName = user.signInDetails?.loginId?.split('@')[0];
  const userId = user?.userId;
  
  // データクライアントの生成
  const client = generateClient<Schema>();
  
  // ドキュメント一覧
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザーのドキュメント一覧を取得
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // データベースからユーザーのドキュメント一覧を取得
        const response = await client.models.Document.list();
        setUploadedDocuments(response.data.map(doc => ({
          id: doc.id,
          name: doc.name,
          date: doc.uploadDate ? new Date(doc.uploadDate).toISOString().split('T')[0] : '不明',
          status: doc.status || '不明',
          key: doc.key || ''
        })));
      } catch (error) {
        console.error("ドキュメント一覧の取得に失敗しました", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [client.models.Document]);

  // アップロード成功時のハンドラー
  const handleUploadSuccess = (newDocument: any) => {
    setUploadedDocuments([newDocument, ...uploadedDocuments]);
  };

  // ドキュメント削除時のハンドラー
  const handleDocumentDeleted = (docId: string) => {
    setUploadedDocuments(uploadedDocuments.filter(doc => doc.id !== docId));
  };

  return (
    <main className="container">
      <Header userName={userName} />
      <UploadForm userId={userId} onUploadSuccess={handleUploadSuccess} />
      <DocumentList 
        documents={uploadedDocuments} 
        isLoading={isLoading} 
        onDocumentDeleted={handleDocumentDeleted} 
      />
    </main>
  );
}
