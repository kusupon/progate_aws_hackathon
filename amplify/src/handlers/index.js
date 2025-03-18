// src/handlers/index.js

const textractService = require('../services/textractServices');
const comprehendService = require('../services/comprehendService');

exports.handler = async (event) => {
    try {
        console.info('Received event', JSON.stringify(event, null, 2));

        for (const record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

            console.info(`Processing file: ${objectKey} from bucket: ${bucketName}`);

            const textractResult = await textractService.extractText(bucketName, objectKey);
            console.info('Textract result:', JSON.stringify(textractResult, null, 2));

            // 追加: 抽出されたテキストが存在する場合、Comprehendで解析を実行
            if (textractResult.text && textractResult.text.trim() !== '') {
                const comprehendResult = await comprehendService.analyzeText(textractResult.text);
                console.info('Comprehend result:', JSON.stringify(comprehendResult, null, 2));
            } else {
                console.warn('No text extracted to analyze with Comprehend.');
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Processing completed successfully' })
        };
    } catch (error) {
        console.error('Error processing event:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error processing the event',
                error: error.message
            })
        };
    }
};
