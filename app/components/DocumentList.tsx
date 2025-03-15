"use client";

import Link from "next/link";
import { useState } from "react";
import { remove } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

interface Document {
  id: string;
  name: string;
  date: string;
  status: string;
  key: string;
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onDocumentDeleted: (docId: string) => void;
}

export default function DocumentList({ documents, isLoading, onDocumentDeleted }: DocumentListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const client = generateClient<Schema>();

  // 削除ハンドラー
  const handleDelete = async (docId: string, docKey: string) => {
    if (!docId || !docKey) return;
    
    if (!confirm("このドキュメントを削除してもよろしいですか？")) {
      return;
    }
    
    setIsDeleting(docId);
    console.log("削除開始 - ドキュメントID:", docId, "ファイルパス:", docKey);
    
    try {
      // データベースからドキュメント情報を削除
      await client.models.Document.delete({
        id: docId
      });
      console.log("データベースからの削除に成功しました");
      
      // S3からファイルを削除
      try {
        console.log("S3ファイルの削除を試みます:", docKey);
        await remove({
          path: docKey
        });
        console.log("S3ファイルの削除に成功しました");
      } catch (storageError) {
        console.error("S3ファイルの削除に失敗しましたが、処理を続行します", storageError);
        // S3の削除に失敗しても処理を続行
      }
      
      // 親コンポーネントに削除を通知
      onDocumentDeleted(docId);
      
      alert("ドキュメントが削除されました");
    } catch (error) {
      console.error("ドキュメントの削除に失敗しました", error);
      alert("ドキュメントの削除に失敗しました。もう一度お試しください。");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="documents-section">
      <h2>アップロード済み文書</h2>
      
      {isLoading ? (
        <p className="loading">読み込み中...</p>
      ) : documents.length === 0 ? (
        <p className="no-documents">アップロードされた文書はありません</p>
      ) : (
        <div className="documents-list">
          <div className="document-header">
            <span className="document-name">ファイル名</span>
            <span className="document-date">アップロード日</span>
            <span className="document-status">ステータス</span>
            <span className="document-action">操作</span>
          </div>
          
          {documents.map(doc => (
            <div key={doc.id} className={`document-item status-${doc.status.replace(/\s+/g, '-')}`}>
              <span className="document-name">{doc.name}</span>
              <span className="document-date">{doc.date}</span>
              <span className="document-status">{doc.status}</span>
              <span className="document-action">
                <div className="action-buttons">
                  <Link href={`/result?fileName=${encodeURIComponent(doc.name)}&id=${doc.id}`}>
                    <button className="btn btn-small">詳細</button>
                  </Link>
                  <button 
                    className="btn btn-small btn-delete"
                    onClick={() => handleDelete(doc.id, doc.key)}
                    disabled={isDeleting === doc.id}
                  >
                    {isDeleting === doc.id ? "削除中..." : "削除"}
                  </button>
                </div>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 