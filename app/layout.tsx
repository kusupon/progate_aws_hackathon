"use client";

import { Inter } from "next/font/google";
import "../styles/app.css";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Amplifyの設定を初期化（アプリ全体で一度だけ行う）
Amplify.configure(outputs);

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>      
        <Authenticator>
          {children}
        </Authenticator>
      </body>
    </html>
  );
}
