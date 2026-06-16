
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_KEY,
    region: process.env.AWS_REGION,
});

exports.uploadToS3 = async (file, key) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();

    return {
        url: result.Location,
        key: result.Key,
    };
};

exports.getSignedDownloadUrl = (key, expiresInSeconds = 300) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Expires: expiresInSeconds,
    };

    return s3.getSignedUrlPromise("getObject", params);
};

