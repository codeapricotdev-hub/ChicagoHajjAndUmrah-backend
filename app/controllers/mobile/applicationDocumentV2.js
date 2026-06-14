const { uploadToS3, getSignedDownloadUrl } = require("../../helpers/mobile/s3");
const ApplicationDocument = require("../../models/mobile/applicationDocument");
const {
    findApplicationByReference,
} = require("../../helpers/mobile/applicationResolver");
const DocumentReuploadRequest = require("../../models/mobile/documentReuploadRequest");
const AdditionalDocumentRequest = require("../../models/mobile/additionalDocumentRequest");

const ALLOWED_DOC_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

const validateUploadFile = (file) => {
    if (!file) {
        return "File is required";
    }
    if (!ALLOWED_DOC_MIME_TYPES.includes(file.mimetype)) {
        return "Unsupported file type";
    }
    return null;
};

exports.uploadDocuments = async (req, res) => {
    try {
        const { applicationId } = req.body;

        if (!applicationId) {
            return res.status(400).json({
                success: false,
                message: "applicationId is required",
            });
        }

        const application = await findApplicationByReference(
            applicationId,
            req.user._id
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
        }

        const uploadedDocs = [];

        for (const file of req.files) {
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
                    message: `Missing applicantId or docType for file index ${index}`,
                });
            }

            const s3Key = `applications/${application._id}/${applicantId}/${docType}`;
            const uploadResult = await uploadToS3(file, s3Key);

            const doc = await ApplicationDocument.findOneAndUpdate(
                {
                    applicationId: application._id,
                    applicantId,
                    docType,
                    userId: req.user._id,
                },
                {
                    fileUrl: uploadResult.url,
                    s3Key,
                    status: "PENDING",
                    statusChangedAt: new Date(),
                    reuploadReason: null,
                    $inc: { version: 1 },
                },
                {
                    upsert: true,
                    new: true,
                }
            );

            uploadedDocs.push(doc);
        }

        return res.json({
            success: true,
            message: "Documents uploaded successfully",
            data: uploadedDocs,
        });
    } catch (error) {
        console.error("UPLOAD DOCUMENTS ERROR", error);

        if (error?.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

exports.reuploadDocument = async (req, res) => {
    try {
        const { documentId } = req.body;
        const file = req.file;

        if (!documentId || !file) {
            return res.status(400).json({
                success: false,
                message: "documentId and file are required",
            });
        }
        const fileError = validateUploadFile(file);
        if (fileError) {
            return res.status(400).json({
                success: false,
                message: fileError,
            });
        }

        const document = await ApplicationDocument.findById(documentId);

        console.log(document)

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        const application = await findApplicationByReference(
            document.applicationId,
            req.user._id
        );
        if (!application) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to re-upload this document",
            });
        }

        const openRequest = await DocumentReuploadRequest.findOne({
            documentId: document._id,
            applicationId: document.applicationId,
            status: "OPEN",
        });

        if (!openRequest && !(document.status === "REJECTED" && document.isReupload)) {
            return res.status(400).json({
                success: false,
                message: "No open re-upload request found for this document",
            });
        }

        const uploadResult = await uploadToS3(file, document.s3Key);

        document.fileUrl = uploadResult.url;
        document.isReupload = false;
        document.reuploadReason = null;
        document.status = "PENDING";
        document.statusChangedAt = new Date();
        document.version += 1;

        await document.save();
        if (openRequest) {
            openRequest.status = "FULFILLED";
            openRequest.resolvedAt = new Date();
            await openRequest.save();
        }

        return res.status(200).json({
            success: true,
            message: "Document re-uploaded successfully",
            data: document,
        });
    } catch (error) {
        console.error("REUPLOAD DOCUMENT ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.uploadAdditionalRequestedDocument = async (req, res) => {
    try {
        const { requestId } = req.params;
        const file = req.file;
        const fileError = validateUploadFile(file);

        if (fileError) {
            return res.status(400).json({
                success: false,
                message: fileError,
            });
        }

        const request = await AdditionalDocumentRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Additional document request not found",
            });
        }

        if (!["OPEN", "REJECTED"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: "This additional document request is not open for upload",
            });
        }

        const application = await findApplicationByReference(
            request.applicationId,
            req.user._id
        );
        if (!application) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to upload this document",
            });
        }

        const safeTitle = request.title
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .toUpperCase();
        const s3Key = `applications/${application._id}/${request.applicantId}/additional/${request._id}-${safeTitle}`;
        const uploadResult = await uploadToS3(file, s3Key);

        const document = await ApplicationDocument.findOneAndUpdate(
            {
                applicationId: application._id,
                applicantId: request.applicantId,
                userId: req.user._id,
                additionalRequestId: request._id,
            },
            {
                applicationId: application._id,
                applicantId: request.applicantId,
                userId: req.user._id,
                docType: "MARRAIGE_CERT",
                displayName: request.title,
                parentDocumentId: request.parentDocumentId,
                additionalRequestId: request._id,
                fileUrl: uploadResult.url,
                s3Key,
                status: "PENDING",
                statusChangedAt: new Date(),
                uploadedByRole: "APPLICANT",
                mimeType: file.mimetype,
                size: file.size,
                originalName: file.originalname,
                rejectionReason: null,
                reuploadReason: null,
                isReupload: request.status === "REJECTED",
                $inc: { version: 1 },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );

        request.status = "UPLOADED";
        request.uploadedDocumentId = document._id;
        request.uploadedAt = new Date();
        request.resolvedAt = null;
        await request.save();

        return res.status(200).json({
            success: true,
            message: "Additional document uploaded successfully",
            data: document,
        });
    } catch (error) {
        console.error("UPLOAD ADDITIONAL DOCUMENT ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.downloadDocument = async (req, res) => {
    try {
        const { documentId } = req.params;
        const document = await ApplicationDocument.findById(documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        const application = await findApplicationByReference(
            document.applicationId,
            req.user._id
        );

        if (!application) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const downloadUrl = await getSignedDownloadUrl(document.s3Key, 120);

        return res.status(200).json({
            success: true,
            data: {
                documentId: document._id,
                docType: document.docType,
                downloadUrl,
                expiresInSeconds: 120,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
