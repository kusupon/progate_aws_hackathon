"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Result = () => {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();

  useEffect(() => {
    // 認証されていない場合はホームページにリダイレクト
    if (authStatus !== "authenticated") {
      router.push("/");
    }
  }, [authStatus, router]);

  return (
    <div>
      <h1>結果ページ</h1>
      <p>認証されたユーザーのみがアクセスできるページです。</p>
      <Link href="../"><button>ホームに戻る</button></Link>
    </div>
  );
};

export default Result;
