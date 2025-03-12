"use client";

import Link from "next/link";
import "../styles/app.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

export default function App() {
  const { user, signOut } = useAuthenticator();

  const userName = user.signInDetails?.loginId?.split('@')[0];

  return (
    <main>
      <h1>ようこそ{userName}さん</h1>
      <Link href="/result"><button>結果ページ</button></Link>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
