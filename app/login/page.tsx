"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "@aws-amplify/ui-react/styles.css";
import { I18n } from "aws-amplify/utils";
import { PT_BR } from "../pt-br";
I18n.putVocabularies(PT_BR);
I18n.setLanguage('ja');


export default function LoginPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  
  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.push('/documents');
    }
  }, [authStatus, router]);


  return (
    <div className="login-container">
      <Authenticator />
    </div>
  );
}