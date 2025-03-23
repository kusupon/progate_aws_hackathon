import { defineStorage, defineFunction } from '@aws-amplify/backend';
import { secret } from '@aws-amplify/backend';
// オンアップロードハンドラー関数を定義
export const onUploadHandler = defineFunction({
  entry: './on-upload-handler.ts',
  environment: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || secret("GEMINI_API_KEY"),
    DOCUMENT_TABLENAME: process.env.DOCUMENTTABLE_NAME || "document-xxx"
  },
  timeoutSeconds: 900,  // 15分（900秒）
  memoryMB: 1024  // MB単位
})


// S3バケットの定義
export const storage = defineStorage({
  name: 'documentStorage',
  triggers: {
    onUpload: onUploadHandler
  },
  access: (allow) => ({
    // 認証されたユーザーは自分のプライベートフォルダにアクセス可能
    'private/{user_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Lambda関数にはS3全体への読み取り権限を付与
    'private/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.resource(onUploadHandler).to(['read'])
    ]
  })
});

// クライアント側で使用するスキーマの型定義
export type StorageSchema = typeof storage;