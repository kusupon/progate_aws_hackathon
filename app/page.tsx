"use client";

import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import {
  Flex,
  View,
  Heading,
  Text,
  Button,
  Card,
  Image,
  Divider,
  Grid,
  ThemeProvider,
  useTheme,
  Badge,
  ScrollView
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useState, useEffect } from "react";

// カスタムセクションコンポーネント
const Section = ({ children, background, padding = "3rem 1rem" }: any) => (
  <View
    width="100%"
    padding={padding}
    backgroundColor={background}
  >
    <View maxWidth="1200px" margin="0 auto">
      {children}
    </View>
  </View>
);

// 機能カードコンポーネント
const FeatureCard = ({ icon, title, description }: any) => {
  const { tokens } = useTheme();
  
  return (
    <Card
      variation="elevated"
      padding="2rem"
      borderRadius="medium"
      boxShadow="0 10px 30px rgba(0, 0, 0, 0.08)"
      height="100%"
      className="feature-card"
    >
      <Flex direction="column" gap="1rem" height="100%">
        <View
          fontSize="2.5rem"
          color="#0066FF"
          textAlign="center"
        >
          {icon}
        </View>
        <Heading level={4} textAlign="center">{title}</Heading>
        <Divider />
        <Text textAlign="center" flex="1">
          {description}
        </Text>
      </Flex>
    </Card>
  );
};

export default function HomePage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const { tokens } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ThemeProvider>
      <View className="landing-container">
        {/* ヘッダー - スクロールで背景が変わる */}
        <View
          as="header"
          style={{ 
            position: "sticky",
            top: 0,
            zIndex: 100,
            backgroundColor: scrolled ? "white" : "transparent",
            boxShadow: scrolled ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "none",
            transition: "all 0.3s ease"
          }}
          width="100%"
        >
          <Flex 
            justifyContent="space-between" 
            alignItems="center" 
            padding="1rem 2rem"
            maxWidth="1200px"
            margin="0 auto"
          >
            <Flex alignItems="center" gap="0.5rem">
              <View
                fontSize="1.5rem"
                color="#0066FF"
                marginRight="0.5rem"
              >
                📝
              </View>
              <Heading level={3}>
                Contract Checker
              </Heading>
            </Flex>
            
            <Flex gap="1rem">
              {authStatus === 'authenticated' ? (
                <Link href="/documents">
                  <Button variation="primary">マイページへ</Button>
                </Link>
              ) : (
                <Flex gap="1rem">
                  <Link href="/login">
                    <Button variation="primary">ログイン</Button>
                  </Link>
                  <Link href="/login">
                    <Button variation="link">新規登録</Button>
                  </Link>
                </Flex>
              )}
            </Flex>
          </Flex>
        </View>

        <main>
          {/* ヒーローセクション - グラデーション背景 */}
          <View
            padding="6rem 1rem"
            backgroundImage="linear-gradient(135deg, #1A365D 0%, #4299E1 100%)"
            color="white"
            textAlign="center"
          >
            <View maxWidth="800px" margin="0 auto">
              <Heading 
                level={1} 
                fontWeight="bold"
                marginBottom="1.5rem"
                fontSize={{ base: '2.5rem', large: '3.5rem' }}
                style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }}
                color="#FFFFFF"
              >
                契約書・利用規約の<br />リスク分析をAIが自動化
              </Heading>
              
              <Text 
                fontSize={{ base: 'medium', large: 'large' }}
                lineHeight="1.6"
                marginBottom="2.5rem"
                fontWeight="500"
                style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" }}
                color="#FFFFFF"
              >
                契約書や利用規約に潜む問題点を瞬時に特定し、リスク評価を提供します。<br />
                ファイルをアップロードするだけで、AIが自動的に文書をチェックし、<br />
                法的リスクや注意すべきポイントを明確に示します。
              </Text>
              
              <Flex justifyContent="center" gap="1rem">
                <Link href="/login">
                  <Button 
                    variation="primary" 
                    size="large"
                    backgroundColor="#4C6FFF"
                    fontWeight="bold"
                    boxShadow="0 4px 14px rgba(0, 0, 0, 0.25)"
                  >
                    今すぐ始める
                  </Button>
                </Link>
                <Link href="#features">
                  <Button 
                    variation="link" 
                    size="large"
                    color="white"
                  >
                    機能を見る ↓
                  </Button>
                </Link>
              </Flex>
            </View>
          </View>
          
          {/* 利点セクション */}
          <Section background="#f8f9fa" id="features">
            <Flex direction="column" gap="3rem">
              <View textAlign="center">
                <Badge variation="info" size="large">信頼性</Badge>
                <Heading level={2} marginTop="1rem">AIによる契約書レビューのメリット</Heading>
                <Text fontSize="large" marginTop="1rem" color="grey">
                  人間の目では見落としがちなリスクをAIが自動検出！
                </Text>
              </View>
              
              <Grid
                templateColumns={{ base: "1fr", medium: "1fr 1fr", large: "1fr 1fr 1fr" }}
                gap="2rem"
              >
                <FeatureCard 
                  icon="⚖️" 
                  title="法的リスク検出" 
                  description="契約書や利用規約に含まれる法的リスクを自動的に特定し、潜在的な問題点を明確に" 
                />
                <FeatureCard 
                  icon="🔍" 
                  title="詳細な分析" 
                  description="問題のある条項を詳細に分析し、リスクの程度を評価。具体的な問題点をわかりやすく解説" 
                />
                <FeatureCard 
                  icon="⏱️" 
                  title="時間の節約" 
                  description="数百ページの契約書も数分でチェック。人手による確認の何十分の一の時間で完了!!" 
                />
                <FeatureCard 
                  icon="📊" 
                  title="スコアリング" 
                  description="契約書の安全性をスコア化。一目で文書のリスクレベルを把握可能" 
                />
                <FeatureCard 
                  icon="🔒" 
                  title="セキュリティ" 
                  description="アップロードされた文書は暗号化され、厳格なセキュリティ基準のもとで処理" 
                />
                <FeatureCard 
                  icon="📱" 
                  title="どこでも利用可能" 
                  description="PCでもスマートフォンでも、いつでもどこでも契約書をチェック可能！" 
                />
              </Grid>
            </Flex>
          </Section>
          
          {/* 使い方セクション */}
          <Section background="white">
            <Flex direction="column" gap="3rem">
              <View textAlign="center">
                <Badge variation="success" size="large">簡単3ステップ</Badge>
                <Heading level={2} marginTop="1rem">使い方はとても簡単</Heading>
                <Text fontSize="large" marginTop="1rem" color="grey">
                  複雑な設定は不要。文書をアップロードするだけで分析が開始されます
                </Text>
              </View>
              
              <Grid
                templateColumns={{ base: "1fr", medium: "1fr 1fr 1fr" }}
                gap="2rem"
                marginTop="2rem"
              >
                <Card variation="outlined" padding="2rem" backgroundColor="#F5F7FA">
                  <Flex direction="column" alignItems="center" gap="1rem">
                    <View
                      backgroundColor="#0066FF"
                      color="white"
                      style={{
                        padding: "0.5rem",
                        borderRadius: "50%",
                        width: "3rem",
                        height: "3rem",
                        textAlign: "center",
                        fontSize: "1.5rem",
                        fontWeight: "bold"
                      }}
                    >
                      1
                    </View>
                    <Heading level={4}>文書をアップロード</Heading>
                    <Text textAlign="center">
                      PDFや Word形式の契約書や利用規約をアップロードします
                    </Text>
                  </Flex>
                </Card>
                
                <Card variation="outlined" padding="2rem" backgroundColor="#F5F7FA">
                  <Flex direction="column" alignItems="center" gap="1rem">
                    <View
                      backgroundColor="#0066FF"
                      color="white"
                      style={{
                        padding: "0.5rem",
                        borderRadius: "50%",
                        width: "3rem",
                        height: "3rem",
                        textAlign: "center",
                        fontSize: "1.5rem",
                        fontWeight: "bold"
                      }}
                    >
                      2
                    </View>
                    <Heading level={4}>AIが自動分析</Heading>
                    <Text textAlign="center">
                      AIが文書を読み込み、法的リスクや問題点を自動的に分析します
                    </Text>
                  </Flex>
                </Card>
                
                <Card variation="outlined" padding="2rem" backgroundColor="#F5F7FA">
                  <Flex direction="column" alignItems="center" gap="1rem">
                    <View
                      backgroundColor="#0066FF"
                      color="white"
                      style={{
                        padding: "0.5rem",
                        borderRadius: "50%",
                        width: "3rem",
                        height: "3rem",
                        textAlign: "center",
                        fontSize: "1.5rem",
                        fontWeight: "bold"
                      }}
                    >
                      3
                    </View>
                    <Heading level={4}>結果を確認</Heading>
                    <Text textAlign="center">
                      分析結果を確認し、潜在的なリスクや問題点を把握できます
                    </Text>
                  </Flex>
                </Card>
              </Grid>
              
              <Flex justifyContent="center" marginTop="2rem">
                <Link href="/login">
                  <Button variation="primary" size="large">今すぐ試してみる</Button>
                </Link>
              </Flex>
            </Flex>
          </Section>
          
          {/* CTAセクション */}
          <View
            padding="5rem 1rem"
            backgroundImage="linear-gradient(135deg, #3182CE 0%, #1A365D 100%)"
            color="white"
            textAlign="center"
          >
            <View maxWidth="800px" margin="0 auto">
              <Heading 
                level={2} 
                marginBottom="1.5rem"
                fontWeight="bold"
                color="#FFFFFF"
                style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }}
              >
                契約書のリスクを見逃さない、<br />AI分析ツールを今すぐ試そう
              </Heading>
              
              <Text 
                fontSize="large" 
                marginBottom="2rem"
                fontWeight="500"
                color="#FFFFFF"
                style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" }}
              >
                誰でも簡単に使えるツールで、契約書の見落としがちなリスクを特定し、<br />
                より安全な取引を実現しましょう。
              </Text>
              
              <Link href="/login">
                <Button
                  variation="primary"
                  size="large"
                  backgroundColor="white"
                  color="#0066FF"
                  fontWeight="bold"
                >
                  無料で始める
                </Button>
              </Link>
            </View>
          </View>
        </main>
        
        {/* フッター */}
        <View
          as="footer"
          backgroundColor="#2D3748"
          color="white"
          padding="3rem 1rem"
        >
          <View maxWidth="1200px" margin="0 auto">
            <Flex 
              direction={{ base: 'column', medium: 'row' }}
              justifyContent="space-between"
              alignItems={{ base: 'center', medium: 'flex-start' }}
              gap="2rem"
            >
              <Flex direction="column" gap="1rem" alignItems={{ base: 'center', medium: 'flex-start' }}>
                <Flex alignItems="center" gap="0.5rem">
                  <View fontSize="1.5rem">📝</View>
                  <Heading level={4} color="#FFFFFF">Contract Checker</Heading>
                </Flex>
                <Text fontSize="small" color="#E2E8F0">© 2024 Contract Checker All Rights Reserved.</Text>
              </Flex>
              
              <Flex direction="column" gap="1rem" alignItems={{ base: 'center', medium: 'flex-start' }}>
                <Heading level={5} color="#FFFFFF">リンク</Heading>
                <Link href="/login">
                  <Text 
                    color="#E2E8F0" 
                    fontWeight="500"
                    style={{ transition: "color 0.2s ease" }}
                    className="footer-link"
                  >ログイン</Text>
                </Link>
                <Link href="/login">
                  <Text 
                    color="#E2E8F0" 
                    fontWeight="500"
                    style={{ transition: "color 0.2s ease" }}
                    className="footer-link"
                  >新規登録</Text>
                </Link>
              </Flex>
              
              <Flex direction="column" gap="1rem" alignItems={{ base: 'center', medium: 'flex-start' }}>
                <Heading level={5} color="#FFFFFF">お問い合わせ</Heading>
                <Text color="#E2E8F0" fontWeight="500">support@contractchecker.jp</Text>
              </Flex>
            </Flex>
          </View>
        </View>
      </View>
    </ThemeProvider>
  );
}