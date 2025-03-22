"use client";

import { Inter } from "next/font/google";
import "../styles/app.css";

import { Authenticator, useAuthenticator, View } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

// Amplifyの設定を初期化
Amplify.configure(outputs);

// 認証が必要なパスのリスト
const PROTECTED_PATHS = ['/documents', '/result'];
// 認証済みユーザーをリダイレクトするパス
const REDIRECT_IF_AUTHENTICATED = ['/login'];

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <Authenticator.Provider>
          <AuthContent>{children}</AuthContent>
        </Authenticator.Provider>
      </body>
    </html>
  );
}

function AuthContent({ children }: { children: ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 認証が必要なページにアクセスしたとき、未認証ならログインページへリダイレクト
    if (PROTECTED_PATHS.some(path => pathname.startsWith(path)) && authStatus !== 'authenticated') {
      router.push('/login');
    }
    
    // 認証済みユーザーが、認証済みユーザー向けでないページにアクセスしたとき、
    // ダッシュボードへリダイレクト
    if (REDIRECT_IF_AUTHENTICATED.includes(pathname) && authStatus === 'authenticated') {
      router.push('/documents');
    }
  }, [authStatus, pathname, router]);

  // 認証が必要なページの場合のみAuthenticatorを表示
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path)) && authStatus !== 'authenticated') {
    return (
      <Authenticator>
        {children}
      </Authenticator>
    );
  }

  return <>{children}</>;
}