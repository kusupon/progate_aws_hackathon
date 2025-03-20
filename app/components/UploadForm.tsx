"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

interface UploadFormProps {
  userId: string | undefined;
  onUploadSuccess: (newDocument: any) => void;
}

export default function UploadForm({ userId, onUploadSuccess }: UploadFormProps) {
  const router = useRouter();
  const client = generateClient<Schema>();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ファイル選択ハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // アップロードハンドラー
  const handleUpload = async () => {
    if (!selectedFile || !userId) return;
    
    setIsUploading(true);
    
    try {
      // ファイル名から拡張子を取得
      const fileExtension = selectedFile.name.split('.').pop() || '';

      const encodedFileName = Date.now() + '_' + 
      selectedFile.name.replace(/[^\x00-\x7F]/g, '_');
      
      // S3のキーを生成（ユーザーIDをプレフィックスとして使用）
      const key = `private/${userId}/${encodedFileName}`;
      
      // まずデータベースにドキュメント情報を保存
      const documentResult = await client.models.Document.create({
        name: selectedFile.name,
        key: key,
        size: selectedFile.size,
        type: selectedFile.type,
        uploadDate: new Date().toISOString(),
        status: "分析中",
        userId: userId
      });
      
      if (!documentResult.data) {
        throw new Error("ドキュメント情報の保存に失敗しました");
      }
      
      const documentId = documentResult.data.id;
      
      // データベースへの保存成功後、S3にファイルをアップロード
      await uploadData({
        path: key,
        data: selectedFile,
        options: {
          contentType: selectedFile.type,
          metadata: {
            userId: userId,
            fileName: btoa(unescape(encodeURIComponent(selectedFile.name))),
            documentId: documentId // ドキュメントIDをメタデータに含める
          }
        }
      }).result;
            
      // 新しいドキュメントをリストに追加
      const newDocument = {
        id: documentId,
        name: selectedFile.name,
        date: new Date().toISOString().split('T')[0],
        status: "分析中",
        key: key
      };
      
      onUploadSuccess(newDocument);
      setSelectedFile(null);
      
      // アップロード完了後、result.tsxに遷移
      router.push(`/result?fileName=${encodeURIComponent(selectedFile.name)}&id=${documentId}`);
      
    } catch (error) {
      console.error("ファイルのアップロードに失敗しました", error);
      alert("ファイルのアップロードに失敗しました。もう一度お試しください。");
    } finally {
      setIsUploading(false);
    }
  };

  return (
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
  );
} 