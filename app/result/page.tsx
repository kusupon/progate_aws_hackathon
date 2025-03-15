"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "../../styles/app.css";

const Result = () => {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    // 認証されていない場合はホームページにリダイレクト
    if (authStatus !== "authenticated") {
      router.push("/");
    }
    
    // URLパラメータからファイル名を取得
    const fileNameParam = searchParams.get("fileName");
    if (fileNameParam) {
      setFileName(decodeURIComponent(fileNameParam));
    }
  }, [authStatus, router, searchParams]);

  return (
    <div className="container">
      <div className="header">
        <h1>文書分析結果</h1>
        <div className="header-buttons">
          <Link href="/"><button className="btn btn-primary">ホームに戻る</button></Link>
        </div>
      </div>
      
      <div className="result-section">
        {fileName ? (
          <div className="file-info">
            <h2>ファイル情報</h2>
            <div className="file-name-display">
              <span className="label">ファイル名:</span>
              <span className="value">{fileName}</span>
            </div>
            <p className="analysis-message">このファイルの分析結果はこちらに表示されます。</p>
          </div>
        ) : (
          <p className="no-file">ファイル情報が見つかりません。</p>
        )}
      </div>
    </div>
  );
};

export default Result;
