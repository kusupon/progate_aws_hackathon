// AWS SDKを読み込み、Textractクライアントを初期化
const AWS = require('aws-sdk');
const textract = new AWS.Textract();

exports.extractText = async (bucketName, documentKey) => {
  const params = {
    Document: {
      S3Object: {
        Bucket: bucketName,
        Name: documentKey,
      }
    },
    FeatureTypes: ["TABLES", "FORMS"]
  };

  try {
    const response = await textract.detectDocumentText(params).promise();
    let extractedText = '';
    if (response && response.Blocks) {
      extractedText = response.Blocks
        .filter(block => block.BlockType === 'LINE')
        .map(line => line.Text)
        .join('\n');
    }
    return { text: extractedText, rawResponse: response };
  } catch (error) {
    throw new Error('Textract processing failed: ' + error.message);
  }
};
