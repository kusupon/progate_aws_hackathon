"use client";
import { Authenticator, useAuthenticator, ThemeProvider, createTheme } from "@aws-amplify/ui-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "@aws-amplify/ui-react/styles.css";
import { I18n } from "aws-amplify/utils";
import { PT_BR } from "../pt-br";
I18n.putVocabularies(PT_BR);
I18n.setLanguage('ja');

// モダンなテーマをカスタマイズ
const theme = createTheme({
  name: 'modern-theme',
  tokens: {
    colors: {
      background: {
        primary: '#ffffff',
        secondary: '#f5f8fa',
      },
      brand: {
        primary: {
          10: '#eff1fe',
          20: '#d1d9fc',
          40: '#a4b3fa',
          60: '#748cf7',
          80: '#4361ee',
          90: '#2145e0',
          100: '#1939c7',
        },
      },
      border: {
        primary: '#e1e8ed',
      },
    },
    shadows: {
      small: '0 2px 5px rgba(0,0,0,0.05)',
      medium: '0 4px 12px rgba(0,0,0,0.08)',
      large: '0 8px 24px rgba(0,0,0,0.12)',
    },
    radii: {
      small: '4px',
      medium: '8px',
      large: '12px',
    },
  },
});

export default function LoginPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  
  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.push('/documents');
    }
  }, [authStatus, router]);

  const components = {
    SignIn: {
      Header: () => (
        <div style={{ padding: '1rem 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>ログイン</h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>アカウントにログインしてください</p>
        </div>
      ),
      Footer: () => (
        <div style={{ textAlign: 'center', padding: '1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
          <p>Contract Checker © 2024</p>
        </div>
      ),
    },
    SignUp: {
      Header: () => (
        <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>新規登録</h2>
        </div>
      ),
      Footer: () => (
        <div style={{ textAlign: 'center', padding: '1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
          <p>Contract Checker © 2024</p>
        </div>
      ),
    },
  };

  const containerStyle = {
    margin: '3rem auto',
    maxWidth: '480px',
    padding: '0',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  };

  return (
    <div className="login-container" style={containerStyle}>
      <ThemeProvider theme={theme}>
        <Authenticator 
          components={components}
          variation="modal"
          loginMechanisms={['email']} 
          hideSignUp={false}
          formFields={{
            signIn: {
              username: {
                placeholder: 'メールアドレス',
                isRequired: true,
                autocomplete: 'username',
              },
              password: {
                placeholder: 'パスワード',
                isRequired: true,
                autocomplete: 'current-password',
              }
            }
          }}
        />
      </ThemeProvider>
    </div>
  );
}