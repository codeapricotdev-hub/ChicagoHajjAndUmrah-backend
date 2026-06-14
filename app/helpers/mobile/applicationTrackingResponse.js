const { WORKFLOW_SEQUENCE, getCanonicalStatus } = require("./applicationWorkflow");

const STANDARD_DOCUMENT_TYPES = ["PASSPORT", "PHOTO"];
const DOWNLOAD_DOCUMENT_TYPES = ["VISA", "ITINERARY", "INSURANCE"];

const STATUS_MESSAGES = {
    DRAFT: "Application draft is pending submission.",
    SUBMITTED: "Application submitted successfully.",
    PAYMENT_VERIFICATION: "Payment is being verified.",
    UNDER_REVIEW: "Documents are under review.",
    PROCESSING: "Visa processing is in progress.",
    VISA_ISSUED: "Visa has been issued.",
    REJECTED: "Application has been rejected.",
};

const VISA_VALIDITY = {
    UMRAH: "Umrah visa",
    "1_YEAR": "1 year",
    "5_YEAR": "5 years",
    "10_YEAR": "10 years",
};

const STAGE_NAMES = {
    PAYMENT_VERIFICATION: "Payment Verification",
    UNDER_REVIEW: "Document Review",
    PROCESSING: "Visa Processing",
    VISA_ISSUED: "Visa Issued",
};

const toPlainObject = (value) => {
    if (!value) {
        return value;
    }

    return typeof value.toObject === "function" ? value.toObject() : value;
};

const sameId = (left, right) => left?.toString() === right?.toString();

const getStatusMessage = (status) => {
    const canonicalStatus = getCanonicalStatus(status);
    return STATUS_MESSAGES[canonicalStatus] || STATUS_MESSAGES[status] || "Application status is being updated.";
};

const buildTimeline = (application, statusHistory = []) => {
    const currentStatus = getCanonicalStatus(application?.status);
    const currentIndex = WORKFLOW_SEQUENCE.indexOf(currentStatus);
    const historyByStatus = statusHistory.reduce((result, item) => {
        const targetStatus = getCanonicalStatus(item.toStatus);
        if (!result[targetStatus]) {
            result[targetStatus] = item.changedAt || item.createdAt || item.updatedAt || null;
        }
        return result;
    }, {});
    const initialStatus = getCanonicalStatus(application?.status);

    if (
        !historyByStatus.PAYMENT_VERIFICATION &&
        (application?.createdAt || application?.statusChangedAt) &&
        WORKFLOW_SEQUENCE.includes(initialStatus)
    ) {
        historyByStatus.PAYMENT_VERIFICATION =
            application.createdAt || application.statusChangedAt;
    }

    const timeline = WORKFLOW_SEQUENCE.map((stage, index) => {
        let status = "upcoming";

        if (currentStatus === "REJECTED") {
            status = historyByStatus[stage] ? "completed" : "upcoming";
        } else if (currentStatus === "VISA_ISSUED" && index <= currentIndex) {
            status = "completed";
        } else if (index < currentIndex) {
            status = "completed";
        } else if (index === currentIndex) {
            status = "current";
        }

        return {
            name: STAGE_NAMES[stage] || stage,
            date:
                historyByStatus[stage] ||
                (stage === currentStatus ? application?.statusChangedAt : null),
            status,
        };
    });

    if (currentStatus === "REJECTED") {
        timeline.push({
            name: "Rejected",
            date: historyByStatus.REJECTED || application?.statusChangedAt || null,
            status: "current",
        });
    }

    return timeline;
};

const buildApplicantDocuments = (applicants = [], documents = []) =>
    applicants.map((applicant) => {
        const applicantObject = toPlainObject(applicant);
        const applicantDocuments = documents.filter((document) =>
            sameId(document.applicantId, applicantObject._id)
        );

        const mapDocument = (document) => ({
            documentId: document._id,
            type: document.docType,
            displayName: document.displayName || document.docType,
            parentDocumentId: document.parentDocumentId || null,
            additionalRequestId: document.additionalRequestId || null,
            status: document.status || "PENDING",
            fileUrl: document.fileUrl || null,
            uploadedAt: document.createdAt || null,
            updatedAt: document.updatedAt || null,
            rejectionReason: document.rejectionReason || null,
            reuploadReason: document.reuploadReason || null,
            isReupload: Boolean(document.isReupload),
        });

        return {
            ...applicantObject,
            documents: {
                standard: applicantDocuments
                    .filter((document) => STANDARD_DOCUMENT_TYPES.includes(document.docType))
                    .map(mapDocument),
                additional: applicantDocuments
                    .filter(
                        (document) =>
                            !STANDARD_DOCUMENT_TYPES.includes(document.docType) &&
                            !DOWNLOAD_DOCUMENT_TYPES.includes(document.docType)
                    )
                    .map(mapDocument),
            },
        };
    });

const buildDownloads = (documents = []) =>
    DOWNLOAD_DOCUMENT_TYPES.reduce((result, docType) => {
        const document = documents.find((item) => item.docType === docType);
        const key = docType.toLowerCase();

        result[key] = document
            ? {
                documentId: document._id,
                status: document.status || "PENDING",
                fileUrl: document.fileUrl || null,
                uploadedAt: document.createdAt || null,
                updatedAt: document.updatedAt || null,
                rejectionReason: document.rejectionReason || null,
                reuploadReason: document.reuploadReason || null,
                isReupload: Boolean(document.isReupload),
            }
            : null;

        return result;
    }, {});

const buildPayment = (payment) => {
    if (!payment) {
        return {
            amount: null,
            status: "PENDING",
            method: null,
            isReupload: false,
            canRepay: false,
            transactionId: null,
        };
    }

    return {
        amount: payment.amount ?? null,
        status: payment.status || "PENDING",
        method: payment.paymentMode || null,
        remarks: payment.adminRemark || null,
        adminRemark: payment.adminRemark || null,
        isReupload: Boolean(payment.isReupload),
        canRepay: Boolean(payment.isReupload),
        transactionId: payment.transactionId || null,
        paymentId: payment._id?.toString() || null
    };
};

const buildApplicationTrackingResponse = ({
    application,
    applicants = [],
    documents = [],
    statusHistory = [],
    payment = null,
}) => {
    const applicationObject = toPlainObject(application);
    const applicantObjects = applicants.map(toPlainObject);
    const documentObjects = documents.map(toPlainObject);
    const historyObjects = statusHistory.map(toPlainObject);
    const paymentObject = toPlainObject(payment);

    return {
        status: {
            status: applicationObject?.status || null,
            message: getStatusMessage(applicationObject?.status),
        },
        summary: {
            visaType: applicationObject?.visaType || null,
            validity: VISA_VALIDITY[applicationObject?.visaType] || null,
            submittedDate: applicationObject?.createdAt || null,
            totalApplicants: applicantObjects.length,
            applicationIdentifier: applicationObject?.applicationIdentifier
        },
        timeline: buildTimeline(applicationObject, historyObjects),
        applicantsAndDocuments: buildApplicantDocuments(applicantObjects, documentObjects),
        downloads: buildDownloads(documentObjects),
        payment: buildPayment(paymentObject),
    };
};

module.exports = {
    buildApplicationTrackingResponse,
    getStatusMessage,
};
