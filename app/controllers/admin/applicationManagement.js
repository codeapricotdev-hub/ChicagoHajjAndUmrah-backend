const mongoose = require("mongoose");
const Application = require("../../models/mobile/application");
const ApplicantDetails = require("../../models/mobile/applicationDetails");
const ApplicationDocument = require("../../models/mobile/applicationDocument");
const ApplicationStatusHistory = require("../../models/mobile/applicationStatusHistory");
const DocumentReuploadRequest = require("../../models/mobile/documentReuploadRequest");
const AdditionalDocumentRequest = require("../../models/mobile/additionalDocumentRequest");
const ApplicationAuditLog = require("../../models/mobile/applicationAuditLog");
const AppUser = require("../../models/appUser");
const Payment = require("../../models/mobile/payment");
const { uploadToS3, getSignedDownloadUrl } = require("../../helpers/mobile/s3");
const {
    notifyApplicationStatusChange,
    notifyManualPaymentOutcome,
    notifyPaymentStatusChange,
    notifyDocumentRejected,
    notifyDocumentAccepted,
    notifyAdditionalDocumentRequested,
} = require("../../helpers/mobile/userNotificationService");
const {
    WORKFLOW_SEQUENCE,
    getCanonicalStatus,
    canTransitionStatus,
} = require("../../helpers/mobile/applicationWorkflow");
const {
    buildApplicationTrackingResponse,
} = require("../../helpers/mobile/applicationTrackingResponse");

const ADMIN_DOC_TYPES = ["VISA", "INSURANCE", "ITINERARY"];
const DOCUMENT_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "REJECTED", "FAILED"];
const ALLOWED_DOC_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];
const MARRIAGE_CERTIFICATE_TITLE = "Marriage Certificate";

const createAuditLog = async ({
    applicationId,
    action,
    actorType,
    actorId,
    metadata,
}) => {
    await ApplicationAuditLog.create({
        applicationId,
        action,
        actorType,
        actorId,
        metadata: metadata || {},
    });
};

exports.getApplications = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            const appUsers = await AppUser.find({
                $or: [
                    { fullName: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { mobile: { $regex: search, $options: "i" } },
                ],
            }).select("_id");

            query.$or = [
                { applicationIdentifier: { $regex: search, $options: "i" } },
                { userId: { $in: appUsers.map((u) => u._id) } },
            ];
        }

        const applications = await Application.find(query)
            .populate("userId", "fullName email mobile")
            .sort({ createdAt: -1 })
            .skip((Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit)))
            .limit(Math.max(1, Number(limit)));

        const total = await Application.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: {
                list: applications,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await Application.findById(id).populate(
            "userId",
            "fullName email mobile"
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        const [
            applicants,
            documents,
            timeline,
            reuploadRequests,
            additionalDocumentRequests,
            payments,
            paymentHistory,
        ] = await Promise.all([
            ApplicantDetails.find({ applicationId: id }).sort({ createdAt: 1 }),
            ApplicationDocument.find({ applicationId: id }).sort({ updatedAt: -1 }),
            ApplicationStatusHistory.find({ applicationId: id })
                .populate("changedByAdminId", "fullName email")
                .populate("changedByUserId", "fullName email mobile")
                .sort({ changedAt: -1 }),
            DocumentReuploadRequest.find({ applicationId: id })
                .populate("requestedByAdminId", "fullName email")
                .sort({ requestedAt: -1 }),
            AdditionalDocumentRequest.find({ applicationId: id })
                .populate("requestedByAdminId", "fullName email")
                .populate("uploadedDocumentId")
                .sort({ requestedAt: -1 }),
            Payment.find({ applicationId: id }).sort({ createdAt: -1 }),
            ApplicationAuditLog.find({
                applicationId: id,
                action: "PAYMENT_STATUS_UPDATED",
            }).sort({ createdAt: -1 }),
        ]);
        const latestPayment = payments[0] || null;

        const tracking = buildApplicationTrackingResponse({
            application,
            applicants,
            documents,
            statusHistory: timeline,
            payment: latestPayment,
        });

        return res.status(200).json({
            success: true,
            data: {
                application,
                applicants,
                documents,
                timeline,
                reuploadRequests,
                additionalDocumentRequests,
                workflow: WORKFLOW_SEQUENCE,
                payments,
                paymentHistory,
                status: tracking.status,
                summary: tracking.summary,
                trackingTimeline: tracking.timeline,
                applicantsAndDocuments: tracking.applicantsAndDocuments,
                downloads: tracking.downloads,
                payment: tracking.payment,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id, paymentId } = req.params;
        const { status, adminRemark } = req.body;

        if (!PAYMENT_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status",
            });
        }

        const payment = await Payment.findOne({
            _id: paymentId,
            applicationId: id,
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        const previousStatus = payment.status;
        payment.status = status;
        payment.adminRemark = adminRemark || null;
        payment.isReupload = status === "REJECTED";
        await payment.save();

        const isManualPayment = ["MANUAL_CHEQUE", "ZELLE"].includes(payment.paymentMode);
        const shouldNotifyOutcome =
            status !== previousStatus && ["SUCCESS", "FAILED", "REJECTED"].includes(status);

        let pushResult = { skipped: true, reason: "No payment outcome notification required" };
        if (shouldNotifyOutcome) {
            pushResult = isManualPayment
                ? await notifyManualPaymentOutcome(payment, previousStatus)
                : await notifyPaymentStatusChange(payment, previousStatus);
        }

        await createAuditLog({
            applicationId: id,
            action: "PAYMENT_STATUS_UPDATED",
            actorType: "ADMIN",
            actorId: req.user._id,
            metadata: {
                paymentId: payment._id,
                paymentMode: payment.paymentMode,
                amount: payment.amount,
                previousStatus,
                currentStatus: status,
                adminRemark: adminRemark || null,
                isReupload: payment.isReupload,
                statusChangedAt: payment.updatedAt,
                pushResult,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            data: payment,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        if (!status || (!WORKFLOW_SEQUENCE.includes(status) && status !== "REJECTED")) {
            return res.status(400).json({
                success: false,
                message: "Invalid target status",
            });
        }

        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        const latestPayment = await Payment.findOne({ applicationId: id }).sort({
            createdAt: -1,
        });
        if (!latestPayment || latestPayment.status !== "SUCCESS") {
            return res.status(400).json({
                success: false,
                message:
                    "Application status cannot be updated until payment status is successful",
            });
        }

        const fromStatus = getCanonicalStatus(application.status);
        const targetStatus = getCanonicalStatus(status);

        if (targetStatus === "REJECTED") {
            if (fromStatus === "REJECTED" || fromStatus === "VISA_ISSUED") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid workflow transition",
                });
            }
        } else if (!canTransitionStatus(fromStatus, status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid workflow transition",
            });
        }

        application.status = status;
        application.statusChangedAt = new Date();
        await application.save();

        await ApplicationStatusHistory.create({
            applicationId: application._id,
            fromStatus,
            toStatus: status,
            changedByAdminId: req.user._id,
            note: note || null,
            changedAt: new Date(),
        });

        const pushResult = await notifyApplicationStatusChange(
            application,
            fromStatus,
            status
        );

        await createAuditLog({
            applicationId: application._id,
            action: "STATUS_UPDATED",
            actorType: "ADMIN",
            actorId: req.user._id,
            metadata: { fromStatus, toStatus: status, note: note || null, pushResult },
        });

        return res.status(200).json({
            success: true,
            message: "Application status updated",
            data: application,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.getApplicationTimeline = async (req, res) => {
    try {
        const { id } = req.params;
        const timeline = await ApplicationStatusHistory.find({ applicationId: id })
            .populate("changedByAdminId", "fullName email")
            .populate("changedByUserId", "fullName email mobile")
            .sort({ changedAt: -1 });

        return res.status(200).json({
            success: true,
            data: timeline,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.uploadAdminDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { applicantId, docType } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Document file is required",
            });
        }
        if (!ALLOWED_DOC_MIME_TYPES.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported file type",
            });
        }
        if (!ADMIN_DOC_TYPES.includes(docType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin document type",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(applicantId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid applicantId",
            });
        }

        const [application, applicant] = await Promise.all([
            Application.findById(id),
            ApplicantDetails.findOne({ _id: applicantId, applicationId: id }),
        ]);

        if (!application || !applicant) {
            return res.status(404).json({
                success: false,
                message: "Application or applicant not found",
            });
        }

        const s3Key = `applications/${application._id}/${applicantId}/${docType}`;
        const uploadResult = await uploadToS3(file, s3Key);

        const document = await ApplicationDocument.findOneAndUpdate(
            {
                applicationId: application._id,
                applicantId,
                userId: application.userId,
                docType,
            },
            {
                fileUrl: uploadResult.url,
                s3Key,
                docType,
                status: "APPROVED",
                statusChangedAt: new Date(),
                uploadedByRole: "ADMIN",
                mimeType: file.mimetype,
                size: file.size,
                originalName: file.originalname,
                reuploadReason: null,
                isReupload: false,
                $inc: { version: 1 },
            },
            { upsert: true, new: true }
        );

        await createAuditLog({
            applicationId: application._id,
            action: "ADMIN_DOCUMENT_UPLOADED",
            actorType: "ADMIN",
            actorId: req.user._id,
            metadata: {
                applicantId,
                docType,
                documentId: document._id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Document uploaded successfully",
            data: document,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.downloadDocument = async (req, res) => {
    try {
        const { id, documentId } = req.params;
        const document = await ApplicationDocument.findOne({
            _id: documentId,
            applicationId: id,
        });

        if (!document || !document.s3Key) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        const downloadUrl = await getSignedDownloadUrl(document.s3Key, 120);

        await createAuditLog({
            applicationId: id,
            action: "DOCUMENT_DOWNLOAD_LINK_GENERATED",
            actorType: "ADMIN",
            actorId: req.user._id,
            metadata: { documentId: document._id, docType: document.docType },
        });

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
            message: error.message || "Server error",
        });
    }
};

exports.requestDocumentReupload = async (req, res) => {
    try {
        const { id, documentId } = req.params;
        const { reason } = req.body;

        if (!reason || String(reason).trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: "Reason is required (min 5 chars)",
            });
        }

        const document = await ApplicationDocument.findOne({
            _id: documentId,
            applicationId: id,
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        const existingOpenRequest = await DocumentReuploadRequest.findOne({
            applicationId: id,
            documentId: document._id,
            status: "OPEN",
        });

        if (existingOpenRequest) {
            return res.status(409).json({
                success: false,
                message: "An open re-upload request already exists for this document",
            });
        }

        const request = await DocumentReuploadRequest.create({
            applicationId: id,
            documentId: document._id,
            applicantId: document.applicantId,
            requestedByAdminId: req.user._id,
            reason: String(reason).trim(),
            status: "OPEN",
            requestedAt: new Date(),
        });

        document.isReupload = true;
        document.reuploadReason = String(reason).trim();
        document.rejectionReason = String(reason).trim();
        document.status = "REJECTED";
        document.statusChangedAt = new Date();
        await document.save();

        const pushResult = await notifyDocumentRejected({
            userId: document.userId,
            applicationId: id,
            documentId: document._id,
            docType: document.docType,
            reuploadRequestId: request._id,
            isAdditionalDocument: Boolean(document.additionalRequestId),
        });

        await createAuditLog({
            applicationId: id,
            action: "DOCUMENT_REUPLOAD_REQUESTED",
            actorType: "ADMIN",
            actorId: req.user._id,
            metadata: {
                documentId: document._id,
                requestId: request._id,
                reason: request.reason,
                pushResult,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Re-upload requested successfully",
            data: request,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.requestAdditionalDocument = async (req, res) => {
    try {
        const { id, documentId } = req.params;
        const title = MARRIAGE_CERTIFICATE_TITLE;
        const reason = String(req.body.reason || req.body.comment || "").trim();

        if (reason.length < 5 || reason.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Reason is required and must be 5-500 characters",
            });
        }

        const [application, document] = await Promise.all([
            Application.findById(id),
            ApplicationDocument.findOne({
                _id: documentId,
                applicationId: id,
            }),
        ]);

        if (!application || !document) {
            return res.status(404).json({
                success: false,
                message: "Application or document not found",
            });
        }

        const applicant = await ApplicantDetails.findOne({
            _id: document.applicantId,
            applicationId: id,
        });

        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: "Applicant not found",
            });
        }
        if (!applicant.isAdult) {
            return res.status(400).json({
                success: false,
                message: "Marriage certificate can only be requested for adult applicants",
            });
        }
        if (!document.fileUrl) {
            return res.status(400).json({
                success: false,
                message: "Additional documents can only be requested against an uploaded document",
            });
        }

        const openRequest = await AdditionalDocumentRequest.findOne({
            applicationId: id,
            applicantId: document.applicantId,
            title,
            status: "OPEN",
        });

        if (openRequest) {
            return res.status(409).json({
                success: false,
                message: "An open marriage certificate request already exists for this adult applicant",
            });
        }

        const request = await AdditionalDocumentRequest.create({
            applicationId: id,
            applicantId: document.applicantId,
            parentDocumentId: document._id,
            requestedByAdminId: req.user._id,
            title,
            reason,
            status: "OPEN",
            requestedAt: new Date(),
        });

        const pushResult = await notifyAdditionalDocumentRequested({
            userId: application.userId,
            applicationId: application._id,
            requestId: request._id,
            parentDocumentId: document._id,
            title,
            reason,
        });

        await createAuditLog({
            applicationId: application._id,
            action: "ADDITIONAL_DOCUMENT_REQUESTED",
            actorType: "ADMIN",
            actorId: req.user._id,
            metadata: {
                requestId: request._id,
                parentDocumentId: document._id,
                applicantId: document.applicantId,
                title,
                reason,
                pushResult,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Additional document requested successfully",
            data: request,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.updateDocumentStatus = async (req, res) => {
    try {
        const { id, documentId } = req.params;
        const { status, note, rejectionReason } = req.body;

        if (!DOCUMENT_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document status",
            });
        }

        const cleanRejectionReason = String(rejectionReason || note || "").trim();
        if (status === "REJECTED" && cleanRejectionReason.length < 5) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required (min 5 chars)",
            });
        }

        const document = await ApplicationDocument.findOne({
            _id: documentId,
            applicationId: id,
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        const previousStatus = document.status;
        let reuploadRequest = null;
        let pushResult = null;
        document.status = status;
        document.rejectionReason = status === "REJECTED" ? cleanRejectionReason : null;
        if (status === "REJECTED") {
            document.isReupload = true;
            document.reuploadReason = cleanRejectionReason;
        } else {
            document.isReupload = false;
            document.reuploadReason = null;
        }
        document.statusChangedAt = new Date();
        await document.save();

        if (status === "REJECTED") {
            reuploadRequest = await DocumentReuploadRequest.findOne({
                applicationId: id,
                documentId: document._id,
                status: "OPEN",
            });

            if (!reuploadRequest) {
                reuploadRequest = await DocumentReuploadRequest.create({
                    applicationId: id,
                    documentId: document._id,
                    applicantId: document.applicantId,
                    requestedByAdminId: req.user._id,
                    reason: cleanRejectionReason,
                    status: "OPEN",
                    requestedAt: new Date(),
                });
            } else if (reuploadRequest.reason !== cleanRejectionReason) {
                reuploadRequest.reason = cleanRejectionReason;
                await reuploadRequest.save();
            }

            pushResult = await notifyDocumentRejected({
                userId: document.userId,
                applicationId: id,
                documentId: document._id,
                docType: document.docType,
                reuploadRequestId: reuploadRequest._id,
                isAdditionalDocument: Boolean(document.additionalRequestId),
            });
        }

        if (status === "APPROVED") {
            await DocumentReuploadRequest.updateMany(
                {
                    applicationId: id,
                    documentId: document._id,
                    status: "OPEN",
                },
                {
                    $set: {
                        status: "CANCELLED",
                        resolvedAt: new Date(),
                    },
                }
            );

            pushResult = await notifyDocumentAccepted({
                userId: document.userId,
                applicationId: id,
                documentId: document._id,
                docType: document.docType,
            });
        }

        await createAuditLog({
            applicationId: id,
            action: "DOCUMENT_STATUS_UPDATED",
            actorType: "ADMIN",
            actorId: req.user._id,
            metadata: {
                documentId: document._id,
                docType: document.docType,
                previousStatus,
                currentStatus: status,
                note: note || null,
                rejectionReason: status === "REJECTED" ? cleanRejectionReason : null,
                statusChangedAt: document.statusChangedAt,
                reuploadRequestId: reuploadRequest?._id || null,
                pushResult,
            },
        });

        if (document.additionalRequestId) {
            const requestStatus =
                status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "UPLOADED";
            await AdditionalDocumentRequest.findOneAndUpdate(
                {
                    _id: document.additionalRequestId,
                    applicationId: id,
                },
                {
                    status: requestStatus,
                    resolvedAt: status === "PENDING" ? null : new Date(),
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Document status updated successfully",
            data: document,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.getApplicationAuditLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await ApplicationAuditLog.find({ applicationId: id }).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            data: logs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
