"use client";

import Link from "next/link";
import { useState } from "react";
import { remove } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Collection,
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Loader,
  Heading,
  View,
  Alert
} from "@aws-amplify/ui-react";

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
  onDocumentDeleted: (id: string) => void;
}

export default function DocumentList({ documents, isLoading, onDocumentDeleted }: DocumentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const client = generateClient<Schema>();

  // ドキュメントを削除する関数
  const deleteDocument = async (id: string, key: string) => {
    try {
      setDeleting(id);
      setError(null);

      // S3からファイルを削除
      if (key) {
        await remove({ path: key });
      }

      // データベースからドキュメント情報を削除
      await client.models.Document.delete({ id });

      onDocumentDeleted(id);
    } catch (error) {
      console.error("ドキュメント削除エラー:", error);
      setError("ドキュメントの削除に失敗しました。");
    } finally {
      setDeleting(null);
    }
  };

  // ステータスに応じてバッジのバリエーションを返す
  const getStatusVariation = (status: string) => {
    switch (status) {
      case '完了':
        return 'success';
      case '分析中':
        return 'info';
      case 'エラー':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" padding="2rem">
        <Loader size="large" />
        <Text marginLeft="1rem">ドキュメント一覧を読み込み中...</Text>
      </Flex>
    );
  }

  if (documents.length === 0) {
    return (
      <Card variation="outlined" padding="medium" backgroundColor="rgba(0, 0, 255, 0.05)">
        <Flex direction="column" alignItems="center" padding="2rem" gap="1rem">
          <View fontSize="2rem">📂</View>
          <Text>アップロードされたドキュメントはありません</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <View>
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

      <Collection
        type="list"
        items={documents}
        gap="1rem"
      >
        {(document) => (
          <Card 
            key={document.id} 
            variation="elevated"
            padding="medium"
            borderRadius="medium"
          >
            <Flex justifyContent="space-between" alignItems="flex-start">
              <Flex direction="column" gap="0.5rem">
                <Heading level={5}>{document.name}</Heading>
                
                <Flex alignItems="center" gap="0.5rem">
                  <Badge size="small" variation={getStatusVariation(document.status)}>
                    {document.status}
                  </Badge>
                  <Text fontSize="0.9rem" color="grey">
                    アップロード日: {document.date}
                  </Text>
                </Flex>
              </Flex>
              
              <Flex gap="0.5rem">
                <Link
                  href={`/result?id=${document.id}&fileName=${encodeURIComponent(document.name)}`}
                >
                  <Button variation="primary" size="small">
                    分析結果を表示
                  </Button>
                </Link>
                
                <Button
                  variation="destructive"
                  size="small"
                  onClick={() => deleteDocument(document.id, document.key)}
                  isLoading={deleting === document.id}
                  loadingText="削除中"
                >
                  削除
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Collection>
    </View>
  );
} 