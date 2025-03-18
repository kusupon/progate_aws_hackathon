// src/services/comprehendService.js

// AWS SDKを読み込み、Comprehendクライアントを初期化
const AWS = require('aws-sdk');
const comprehend = new AWS.Comprehend();

/**
 * 指定されたテキストを対象に、Amazon Comprehendを使ってエンティティの検出を実行します。
 * @param {string} text - 解析対象のテキスト
 * @returns {Promise<Object>} - 検出されたエンティティ情報を含むオブジェクト
 */
exports.analyzeText = async (text) => {
  // Comprehendに渡すパラメータを設定
  const params = {
    LanguageCode: 'ja', // テキストの言語コード。必要に応じて 'en' などに変更してください
    Text: text
  };

  try {
    // detectEntitiesメソッドを呼び出し、エンティティ検出処理を実行
    const result = await comprehend.detectEntities(params).promise();
    return result;
  } catch (error) {
    // エラー発生時は、エラーメッセージを付与して上位に伝播
    throw new Error('Comprehend analysis failed: ' + error.message);
  }
};
