const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = new S3Client();
const AWS = require('aws-sdk');
const fs = require('fs');
const formidable = require('formidable');

const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_KEY,
})

const uploadFile = (bucketName) => {
  multer({
    storage: multerS3({
      s3: s3,
      bucket: bucketName,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        let newFileName = Date.now().toString() + "_" + file.originalname;
        var fullPath = "movies/" + newFileName;
        cb(null, fullPath);
      },
    }),
  });
}

const uploadOnS3 = async (name, path, bucketName) => {
  try {
    return new Promise(async (resolve, reject) => {
      const blob = fs.readFileSync(path)

      const params = {
        Bucket: bucketName ? `${process.env.S3_BUCKET_NAME}/${bucketName}` : process.env.S3_BUCKET_NAME,
        Key: name,
        Body: blob
      }

      const uploadedImage = await S3.upload(params).promise()
      console.log('data.Location :>> ', uploadedImage, uploadedImage.Location);
      return resolve({ error: false, data: uploadedImage.Location, message: "File Uploaded Successfully" });

      // var form = new formidable.IncomingForm();
      // form.parse(req, async (err, fields, files) => {
      //   console.log('files.movieFile.originalFilename :>> ', files.movieFile.name);
      //   if (err) {
      //     console.log('req :>> ', err);
      //     return reject({ error: false, data: null, message: err.message });
      //   }
      // });

      // form.on("error", function (err) {
      //   console.log("err", err);
      //   return { error: true, data: null, message: err.message };
      // });
    });
  } catch (err) {
    return reject({ error: true, data: null, message: err.message });
  }
}
module.exports = { uploadFile, uploadOnS3 };
