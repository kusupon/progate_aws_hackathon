"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";

interface HeaderProps {
  userName: string | undefined;
}

export default function Header({ userName }: HeaderProps) {
  const { signOut } = useAuthenticator();

  return (
    <div className="header">
      <h1>ようこそ{userName || 'ゲスト'}さん</h1>
      <div className="header-buttons">
        <button onClick={signOut} className="btn btn-secondary">ログアウト</button>
      </div>
    </div>
  );
} 