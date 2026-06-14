const { uploadToS3 } = require("../../helpers/mobile/s3");
const ApplicationDocument = require("../../models/mobile/applicationDocument");

// exports.uploadDocument = async (req, res) => {
//     try {
//         const { applicationId, applicantId, docType } = req.body;
//         const file = req.file;

//         if (!applicationId || !applicantId || !docType) {
//             return res.status(400).json({
//                 success: false,
//                 message: "applicationId, applicantId and docType are required"
//             });
//         }

//         if (!file) {
//             return res.status(400).json({
//                 success: false,
//                 message: "File is required"
//             });
//         }

//         const s3Key = `applications/${applicationId}/${applicantId}/${docType}`;

//         const uploadResult = await uploadToS3(file, s3Key);

//         const doc = await ApplicationDocument.findOneAndUpdate(
//             {
//                 applicationId,
//                 applicantId,
//                 docType,
//                 userId: req.user._id
//             },
//             {
//                 fileUrl: uploadResult.url,
//                 s3Key,
//                 status: "PENDING",
//                 rejectionReason: null,
//                 $inc: { version: 1 }
//             },
//             { upsert: true, new: true }
//         );

//         return res.json({
//             success: true,
//             message: "Document uploaded successfully",
//             data: doc
//         });

//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };



exports.uploadDocuments = async (req, res) => {
    try {

        const { applicationId } = req.body;

        if (!applicationId) {
            return res.status(400).json({
                success: false,
                message: "applicationId is required"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded"
            });
        }

        const uploadedDocs = [];

        for (const file of req.files) {

            // Extract index from fieldname like files[0][file]
            const match = file.fieldname.match(/files\[(\d+)\]\[file\]/);

            if (!match) {
                continue;
            }

            const index = match[1];

            const applicantId =
                req.body[`files[${index}][applicantId]`] ||
                req.body.files?.[index]?.applicantId;

            const docType =
                req.body[`files[${index}][docType]`] ||
                req.body.files?.[index]?.docType;

            if (!applicantId || !docType) {
                return res.status(400).json({
                    success: false,
                    message: `Missing applicantId or docType for file index ${index}`
                });
            }

            const s3Key = `applications/${applicationId}/${applicantId}/${docType}`;

            // Upload to S3
            const uploadResult = await uploadToS3(file, s3Key);

            // Save / Update MongoDB
            const doc = await ApplicationDocument.findOneAndUpdate(
                {
                    applicationId,
                    applicantId,
                    docType,
                    userId: req.user._id
                },
                {
                    fileUrl: uploadResult.url,
                    s3Key,
                    status: "PENDING",
                    reuploadReason: null,
                    $inc: { version: 1 }
                },
                {
                    upsert: true,
                    new: true
                }
            );

            uploadedDocs.push(doc);
        }

        return res.json({
            success: true,
            message: "Documents uploaded successfully",
            data: uploadedDocs
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });

    }
};



exports.reuploadDocument = async (req, res) => {
    try {
        const { documentId } = req.body;
        const file = req.file;

        // if (!documentId) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "documentId is required",
        //     });
        // }

        // if (!file) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "File is required",
        //     });
        // }

        const document = await ApplicationDocument.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        // 🔁 REPLACE FILE IN S3 (same key → overwrite)
        const uploadResult = await uploadToS3(file, document.s3Key);

        // ✅ Update DB
        document.fileUrl = uploadResult.url;
        document.isReupload = false;
        document.reuploadReason = null;
        document.status = "PENDING"; // admin will re-verify

        await document.save();

        return res.status(200).json({
            success: true,
            message: "Document re-uploaded successfully",
            data: document,
        });
    } catch (error) {
        console.error("Reupload error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

