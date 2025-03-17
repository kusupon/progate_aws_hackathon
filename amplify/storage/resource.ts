import { defineStorage } from '@aws-amplify/backend';

// S3バケットの定義
export const storage = defineStorage({
  name: 'documentStorage',
  access: (allow) => ({
    // 認証されたユーザーは自分のプライベートフォルダにアクセス可能
    'private/{user_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // すべての認証されたユーザーがプライベートフォルダにアクセス可能（テスト用）
    'private/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});

// クライアント側で使用するスキーマの型定義
export type StorageSchema = typeof storage;

// 注意: S3バケットの暗号化設定はAWS管理コンソールから変更してください
// 1. AWSコンソールにログイン
// 2. S3サービスに移動
// 3. プロジェクトのバケットを選択
// 4. 「プロパティ」タブ→「デフォルトの暗号化」を編集
// 5. 「Amazon S3 マネージドキー (SSE-S3)」を選択 