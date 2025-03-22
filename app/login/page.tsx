"use client";

import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "@aws-amplify/ui-react/styles.css";

// 日本語翻訳の定義
const japaneseDict = {
  ja: {
    'Sign In': 'ログイン',
    'Sign Up': '新規登録',
    'Sign Out': 'ログアウト',
    'Sign in': 'ログイン',
    'Sign up': '新規登録',
    'Username': 'ユーザー名',
    'Enter your Username': 'ユーザー名を入力してください',
    'Password': 'パスワード',
    'Enter your password': 'パスワードを入力してください',
    'Please confirm your Password': 'パスワードを再入力してください',
    'Email': 'メールアドレス',
    'Enter your Email': 'メールアドレスを入力してください',
    'Phone Number': '電話番号',
    'Enter your Phone Number': '電話番号を入力してください',
    'Forgot your password?': 'パスワードを忘れましたか？',
    'Reset Password': 'パスワードをリセット',
    'No account?': 'アカウントをお持ちでない方は',
    'Create account': 'アカウント作成',
    'Have an account?': 'アカウントをお持ちの方は',
    'Enter your code': '確認コードを入力してください',
    'Confirmation Code': '確認コード',
    'Resend Code': 'コードを再送信',
    'Back to Sign In': 'ログインに戻る',
    'Confirm': '確認',
    'Submit': '送信',
    'Forgot Password': 'パスワードを忘れた方',
    'Create a new account': '新しいアカウントを作成',
    'Reset your password': 'パスワードをリセット',
    'Send code': 'コードを送信',
    'Your passwords must match': 'パスワードが一致しません',
    'Invalid verification code provided, please try again.': '無効な確認コードです。もう一度お試しください。',
    'User already exists': 'このユーザーはすでに存在します',
    'Invalid password format': 'パスワードの形式が無効です',
    'Invalid email address format': '無効なメールアドレス形式です',
    'Invalid phone number format': '無効な電話番号形式です',
    'Username cannot be empty': 'ユーザー名を入力してください',
    'Password cannot be empty': 'パスワードを入力してください',
    'Incorrect username or password': 'ユーザー名またはパスワードが間違っています',
    'Password attempts exceeded': 'パスワード試行回数が上限を超えました'
  }
};

export default function LoginPage() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  
  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.push('/documents');
    }
  }, [authStatus, router]);

  const formFields = {
    signIn: {
      username: {
        label: 'メールアドレス',
        placeholder: 'メールアドレスを入力してください',
      },
      password: {
        label: 'パスワード',
        placeholder: 'パスワードを入力してください',
      }
    },
    signUp: {
      username: {
        label: 'メールアドレス',
        placeholder: 'メールアドレスを入力してください',
      },
      password: {
        label: 'パスワード',
        placeholder: 'パスワードを入力してください',
      },
      confirm_password: {
        label: 'パスワード（確認）',
        placeholder: 'パスワードを再入力してください',
      }
    },
    resetPassword: {
      username: {
        label: 'メールアドレス',
        placeholder: 'メールアドレスを入力してください',
      }
    }
  };

  const components = {
    SignIn: {
      Header: () => (
        <div style={{ padding: '1rem 0', textAlign: 'center' }}>
          <h2>ログイン</h2>
          <p>アカウントにログインしてください</p>
        </div>
      ),
      Footer: () => (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <p>Contract Checker © 2024</p>
        </div>
      )
    },
    SignUp: {
      Header: () => (
        <div style={{ padding: '1rem 0', textAlign: 'center' }}>
          <h2>新規登録</h2>
          <p>新しいアカウントを作成します</p>
        </div>
      )
    },
  };

  const containerStyle = {
    margin: '2rem auto',
    maxWidth: '500px',
    padding: '1.5rem',
    borderRadius: '8px',
    backgroundColor: 'white',
  };

  return (
    <div className="login-container" style={containerStyle}>
      <Authenticator 
        loginMechanisms={['email']}
        formFields={formFields}
        components={components}
        variation="modal"
      />
    </div>
  );
}