
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

const getMimeTypeFromKeyOrName = (key, originalName) => {
    const target = (originalName || key || "").toLowerCase();
    if (target.endsWith(".pdf")) return "application/pdf";
    if (target.endsWith(".png")) return "image/png";
    if (target.endsWith(".jpg") || target.endsWith(".jpeg")) return "image/jpeg";
    if (target.endsWith(".webp")) return "image/webp";
    return null;
};

exports.getMimeTypeFromKeyOrName = getMimeTypeFromKeyOrName;

exports.getSignedDownloadUrl = (key, expiresInSeconds = 300, mimeType = null) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Expires: expiresInSeconds,
    };

    const resolvedMimeType = mimeType || getMimeTypeFromKeyOrName(key);
    if (resolvedMimeType) {
        params.ResponseContentType = resolvedMimeType;
    }

    return s3.getSignedUrlPromise("getObject", params);
};

exports.getObjectFromS3 = (key) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME.trim(),
        Key: key,
    };
    return s3.getObject(params).promise();
};

