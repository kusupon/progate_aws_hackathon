"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "../../styles/app.css";
import { getUrl } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { 
  Flex, 
  Heading, 
  Card, 
  Text, 
  Loader, 
  Badge, 
  Button, 
  Collection,
  Divider,
  View,
  Rating,
  Avatar,
  Menu,
  MenuItem
} from "@aws-amplify/ui-react";
import Header from "../components/Header";

// 評価の問題点を表示するコンポーネント
const EvaluationIssues = ({ issues }: { issues: any[] }) => {
  if (!issues || issues.length === 0) {
    return (
      <Card variation="elevated" padding="medium">
        <Text fontWeight="bold">問題点はありません。</Text>
      </Card>
    );
  }

  return (
    <View>
      <Heading level={4} padding="medium 0">指摘された問題点</Heading>
      <Collection
        type="list"
        items={issues}
        gap="1rem"
      >
        {(issue, index) => (
          <Card key={index} variation="elevated" padding="medium">
            <Flex direction="column" gap="0.5rem">
              <View>
                <Badge variation="warning">問題点</Badge>
                <Text fontWeight="bold" marginTop="0.5rem">{issue.issue}</Text>
              </View>
              <Divider />
              <View>
                <Badge variation="info">問題の詳細</Badge>
                <Text marginTop="0.5rem">{issue.suggestion}</Text>
              </View>
            </Flex>
          </Card>
        )}
      </Collection>
    </View>
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
  
  // ユーザー名を取得
  const userName = user?.signInDetails?.loginId?.split('@')[0];

  // データクライアントの生成
  const client = generateClient<Schema>();

  useEffect(() => {
    // 認証されていない場合はホームページにリダイレクト
    if (authStatus === "unauthenticated") {
      router.push("/");
      return;
    }
    
    // URLパラメータからファイル名とドキュメントIDを取得
    if (authStatus === "authenticated" || authStatus === "configuring") {
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

  // スコアに基づいて評価を決定
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "良好";
    if (score >= 60) return "注意";
    return "改善必要";
  };

  return (
    <Flex direction="column" gap="1rem">
      <Header userName={userName} />
      
      <View padding="1rem">
        <Flex direction="column" gap="2rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading level={2}>文書分析結果</Heading>
            <Link href="/documents">
              <Button variation="primary" size="small">
                マイページに戻る
              </Button>
            </Link>
          </Flex>
          
          {isLoading ? (
            <Flex direction="column" alignItems="center" padding="3rem">
              <Loader size="large" />
              <Text marginTop="1rem">読み込み中...</Text>
            </Flex>
          ) : fileName ? (
            <Flex direction="column" gap="2rem">
              <Card variation="elevated" padding="medium">
                <Heading level={4}>ファイル情報</Heading>
                <Divider marginBlock="1rem" />
                
                <Flex direction="column" gap="1rem">
                  <Flex alignItems="center">
                    <Text fontWeight="bold" width="30%">ファイル名:</Text>
                    <Text>{fileName}</Text>
                  </Flex>
                  
                  {documentData && (
                    <>
                      <Flex alignItems="center">
                        <Text fontWeight="bold" width="30%">アップロード日:</Text>
                        <Text>{new Date(documentData.uploadDate).toLocaleString('ja-JP')}</Text>
                      </Flex>
                      
                      <Flex alignItems="center">
                        <Text fontWeight="bold" width="30%">ファイルサイズ:</Text>
                        <Text>{Math.round(documentData.size / 1024)} KB</Text>
                      </Flex>
                      
                      <Flex alignItems="center">
                        <Text fontWeight="bold" width="30%">ステータス:</Text>
                        <Badge
                          variation={documentData.status === "完了" ? "success" : 
                                     documentData.status === "分析中" ? "info" : "warning"}
                        >
                          {documentData.status}
                        </Badge>
                      </Flex>
                    </>
                  )}
                  
                  {fileUrl && (
                    <Flex marginTop="1rem" justifyContent="flex-end">
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variation="link">ファイルを表示</Button>
                      </a>
                    </Flex>
                  )}
                </Flex>
              </Card>
              
              {/* 分析結果の表示 */}
              {documentData && (
                <Card variation="elevated" padding="medium">
                  <Heading level={4}>分析結果</Heading>
                  <Divider marginBlock="1rem" />
                  
                  <Flex direction="column" gap="2rem">
                    {documentData.evaluationScore !== undefined && (
                      <Card variation="outlined" padding="medium">
                        <Flex direction="column" alignItems="center" gap="0.5rem">
                          <Heading level={5}>評価スコア</Heading>
                          <Flex alignItems="center" gap="1rem">
                            <View 
                              backgroundColor={getScoreColor(documentData.evaluationScore)} 
                              color="white"
                              padding="1rem 2rem"
                              borderRadius="8px"
                            >
                              <Heading level={3} color="white" margin="0">
                                {documentData.evaluationScore}/100
                              </Heading>
                            </View>
                            <Badge size="large" variation={
                              documentData.evaluationScore >= 80 ? "success" : 
                              documentData.evaluationScore >= 60 ? "warning" : "error"
                            }>
                              {getScoreLabel(documentData.evaluationScore)}
                            </Badge>
                          </Flex>
                        </Flex>
                      </Card>
                    )}
                    
                    {documentData.correctedText && (
                      <Card variation="outlined" padding="medium">
                        <Heading level={5}>総合評価</Heading>
                        <Text marginTop="1rem">
                          {documentData.correctedText}
                        </Text>
                      </Card>
                    )}
                    
                    <EvaluationIssues issues={evaluationIssues} />
                  </Flex>
                </Card>
              )}
              
              {documentData && documentData.status === "分析中" && (
                <Card variation="outlined" padding="medium" backgroundColor="rgba(0, 0, 255, 0.05)">
                  <Flex alignItems="center" gap="1rem">
                    <Loader />
                    <Text>現在、このファイルの分析を実行中です。しばらくしてからリロードしてください。</Text>
                  </Flex>
                </Card>
              )}
              
              {documentData && documentData.status !== "分析中" && evaluationIssues.length === 0 && !documentData.correctedText && (
                <Card variation="outlined" padding="medium" backgroundColor="rgba(255, 165, 0, 0.05)">
                  <Text>このファイルの分析結果はまだありません。</Text>
                </Card>
              )}
            </Flex>
          ) : (
            <Card variation="outlined" padding="medium" backgroundColor="rgba(255, 0, 0, 0.05)">
              <Flex direction="column" alignItems="center" padding="2rem" gap="1rem">
                <View fontSize="2rem">📄</View>
                <Text>ファイル情報が見つかりません。</Text>
                <Link href="/">
                  <Button variation="primary" size="small">
                    ホームに戻る
                  </Button>
                </Link>
              </Flex>
            </Card>
          )}
        </Flex>
      </View>
    </Flex>
  );
};

export default Result;
