import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Document: a
    .model({
      name: a.string(),
      key: a.string(), // S3内のキー
      size: a.integer(),
      type: a.string(),
      uploadDate: a.datetime(),
      status: a.string(), // 分析中、問題なし、要確認、問題あり
      userId: a.string(), // ユーザーID
      // 文字起こし結果と評価結果のフィールドを追加
      evaluationScore: a.integer(), // 評価スコア（0-100）
      evaluationIssues: a.string(), // 問題点と修正提案（JSON文字列として保存）
      correctedText: a.string(), // 修正後のテキスト
      analysisResult: a.string(), // 分析結果全体（JSON文字列）
    })
    .authorization(allow => [
      // 所有者のみがアクセス可能
      allow.owner(),
    ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
