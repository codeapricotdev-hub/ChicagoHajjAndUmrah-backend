const AWS = require('aws-sdk');
const fs = require('fs');
const formidable = require('formidable');

// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_S3_SECRET_KEY;

// The name of the bucket that you have created
const BUCKET_NAME = process.env.S3_BUCKET_NAME;


const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

const params = {
    Bucket: BUCKET_NAME,
    CreateBucketConfiguration: {
        // Set your region here
        LocationConstraint: "eu-west-1"
    }
};

exports.uploadFile = (fileName) => {
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    // Setting up S3 upload parameters
    const params = {
        Bucket: BUCKET_NAME,
        Key: '', // File name you want to save as in S3
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

exports.uploadOnS3 = async (name, path, bucketName) => {
    try {
        return new Promise(async (resolve, reject) => {
            console.log('files.image.originalFilename :>> ', name);
            const blob = fs.readFileSync(path)

            const params = {
                Bucket: bucketName ? `${process.env.S3_BUCKET_NAME}/${bucketName}` : process.env.S3_BUCKET_NAME,
                Key: name,
                Body: blob,
            }
            console.log('params :>> ', params);
            try {
                const uploadedImage = await s3.upload(params).promise()
                console.log('data.Location :>> ', uploadedImage, uploadedImage.Location);
                return resolve({ error: false, data: uploadedImage.Location, message: "File Uploaded Successfully" });
            } catch (error) {
                console.log("error", error.message);
                return reject({ error: true, data: null, message: error.message });
            }


            var form = new formidable.IncomingForm();
            form.parse(req, async (err, fields, files) => {
            });

            form.on("error", function (err) {
                console.log("err", err);
                return reject({ error: true, data: null, message: err.message });
            });
        });
    } catch (err) {
        return reject({ error: true, data: null, message: err.message });
    }
    new Promise((resolve, reject) => {
    })
}

exports.removeFromS3 = async (fileName, bucketName) => {
    try {
        return new Promise(async (resolve, reject) => {

            const params = {
                Bucket: bucketName ? `${process.env.S3_BUCKET_NAME}/${bucketName}` : process.env.S3_BUCKET_NAME,
                Key: fileName,
            }

            try {
                //    let fileExists;
                //     s3.headObject(params, function(err, data) {
                //     if (err) console.log(err,err.code); // an error occurred
                //     else     
                //     {   
                //         fileExists=data;
                //         console.log(data);
                //     }           // successful response
                // });
                //    if(fileExists){
                const uploadedImage = await s3.deleteObject(params).promise();
                return resolve({ error: false, data: uploadedImage, message: "File Deleted Successfully" });
                //}
                //return resolve({ error: false,  message: "File Deleted Successfully" });
            } catch (error) {
                console.log("error", error);
                return reject({ error: true, data: null, message: error.message });
            }

        });
    } catch (err) {
        return reject({ error: true, data: null, message: err.message });
    }
}

exports.uploadOnS3SiteMap = async (name, path, bucketName) => {
    try {
        return new Promise(async (resolve, reject) => {
            console.log('files.image.originalFilename :>> ', name);
            const blob = fs.readFileSync(path)

            const params = {
                Bucket: bucketName,
                Key: name,
                Body: blob,
            }
            console.log('params :>> ', params);
            try {
                const uploadedImage = await s3.upload(params).promise()
                console.log('data.Location :>> ', uploadedImage, uploadedImage.Location);
                return resolve({ error: false, data: uploadedImage.Location, message: "File Uploaded Successfully" });
            } catch (error) {
                console.log("error", error.message);
                return reject({ error: true, data: null, message: error.message });
            }

        });
    } catch (err) {
        return reject({ error: true, data: null, message: err.message });
    }
}