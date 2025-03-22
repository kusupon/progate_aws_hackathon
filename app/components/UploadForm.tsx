"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Button,
  Flex,
  Text,
  View,
  Card,
  Alert,
  Loader,
  Badge,
  Heading,
  TextField
} from "@aws-amplify/ui-react";

interface UploadFormProps {
  userId: string | undefined;
  onUploadSuccess: (newDocument: any) => void;
}

export default function UploadForm({ userId, onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const client = generateClient<Schema>();

  // ファイル選択ハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 10MBの上限チェック
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("ファイルサイズは10MB以下にしてください");
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  // ファイルアップロードハンドラー
  const handleUpload = async () => {
    if (!file || !userId) {
      setError("ファイルを選択してください");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      setSuccess(null);

      // ドキュメントIDの生成
      const documentId = crypto.randomUUID();
      
      // ファイルパスの生成 (private/USER_ID/TIMESTAMP_FILENAME)
      const timestamp = Date.now();
      const filename = file.name;
      const key = `private/${userId}/${timestamp}_${filename}`;
      
      // S3にファイルをアップロード（アップロード進捗を監視）
      const result = await uploadData({
        path: key,
        data: file,
        options: {
          metadata: {
            documentId: documentId
          },
          onProgress: (progress) => {
            // 進捗状況を安全に処理
            try {
              // @ts-ignore TransferProgressEventの型が変更されている可能性がある
              setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
            } catch (e) {
              // 進捗の計算に失敗した場合は更新しない
              console.log('Progress calculation failed', progress);
            }
          }
        }
      });
      
      // ドキュメント情報をデータベースに登録
      const newDocument = await client.models.Document.create({
        id: documentId,
        name: filename,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        status: "分析中",
        key: key
      });
      
      // 成功メッセージの表示
      setSuccess(`「${filename}」のアップロードが完了しました。分析結果が準備できるまでお待ちください。`);
      
      // フォームのリセット
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // 親コンポーネントに通知
      onUploadSuccess({
        id: documentId,
        name: filename,
        date: new Date().toISOString().split('T')[0],
        status: "分析中",
        key: key
      });
      
    } catch (error) {
      console.error("アップロードエラー:", error);
      setError("ファイルのアップロードに失敗しました。もう一度お試しください。");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ファイル選択ボタンをクリックする関数
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // ドラッグ&ドロップのハンドラー
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // ドロップハンドラー
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // 10MBの上限チェック
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("ファイルサイズは10MB以下にしてください");
        return;
      }
      
      setFile(droppedFile);
      setError(null);
    }
  };

  return (
    <Card variation="elevated" padding="medium">
      {error && (
        <Alert
          variation="error"
          isDismissible={true}
          hasIcon={true}
          heading="エラー"
          onDismiss={() => setError(null)}
          marginBottom="1rem"
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert
          variation="success"
          isDismissible={true}
          hasIcon={true}
          heading="成功"
          onDismiss={() => setSuccess(null)}
          marginBottom="1rem"
        >
          {success}
        </Alert>
      )}
      
      <Flex direction="column" gap="1rem">
        <View>
          <Text fontWeight="bold" marginBottom="0.5rem">
            分析する文書ファイルを選択してください
          </Text>
          <Text fontSize="0.9rem" color="grey" marginBottom="1rem">
            PDFファイル、Word文書(.docx)、テキストファイル(.txt)に対応しています。
            最大ファイルサイズ: 10MB
          </Text>
        </View>
        
        <View
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          padding="2rem"
          backgroundColor={dragActive ? "rgba(0, 102, 255, 0.05)" : "rgba(0, 0, 0, 0.02)"}
          borderRadius="8px"
          borderStyle="dashed"
          borderWidth="2px"
          borderColor={dragActive ? "brand" : "grey"}
          textAlign="center"
          style={{ cursor: 'pointer' }}
          onClick={triggerFileInput}
        >
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            disabled={uploading}
          />
          
          <Flex direction="column" alignItems="center" gap="1rem">
            <View fontSize="2rem">📄</View>
            <Text fontWeight="bold">
              ファイルをドラッグ＆ドロップするか、クリックして選択してください
            </Text>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                triggerFileInput();
              }}
              variation="primary"
              isDisabled={uploading}
            >
              ファイルを選択
            </Button>
          </Flex>
        </View>
        
        {file && (
          <Card variation="outlined" padding="medium">
            <Flex justifyContent="space-between" alignItems="center">
              <Flex alignItems="center" gap="0.5rem">
                <Badge variation="info">
                  選択済み
                </Badge>
                <Text fontWeight="bold">
                  {file.name}
                </Text>
                <Text fontSize="0.8rem" color="grey">
                  ({Math.round(file.size / 1024)} KB)
                </Text>
              </Flex>
              
              <Button
                onClick={handleUpload}
                isDisabled={uploading}
                isLoading={uploading}
                loadingText="アップロード中..."
                variation="primary"
              >
                アップロード
              </Button>
            </Flex>
          </Card>
        )}
        
        {uploading && (
          <View marginTop="1rem">
            <Flex direction="column" gap="0.5rem">
              <Flex justifyContent="space-between">
                <Text fontSize="0.9rem">アップロード中...</Text>
                <Text fontSize="0.9rem">{uploadProgress}%</Text>
              </Flex>
              
              <View 
                backgroundColor="#f0f0f0"
                padding="0.125rem"
                borderRadius="4px"
                width="100%"
              >
                <View
                  backgroundColor="#0066ff"
                  height="0.5rem"
                  borderRadius="2px"
                  width={`${uploadProgress}%`}
                />
              </View>
            </Flex>
          </View>
        )}
      </Flex>
    </Card>
  );
} 