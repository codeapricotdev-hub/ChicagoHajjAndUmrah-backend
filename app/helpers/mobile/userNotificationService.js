const AppUser = require("../../models/appUser");
const Application = require("../../models/mobile/application");
const Payment = require("../../models/mobile/payment");
const UserNotification = require("../../models/mobile/userNotification");
const { sendPushNotificationToUser, sendPushNotificationToUsers } = require("./pushNotification");
const { getCanonicalStatus } = require("./applicationWorkflow");
const {
    NOTIFICATION_ACTIONS,
    getNotificationTemplate,
} = require("./notificationTemplates");

const stringifyData = (data = {}) =>
    Object.keys(data).reduce((result, key) => {
        result[key] = String(data[key] ?? "");
        return result;
    }, {});

const buildMetadata = (action, extraMetadata = {}) => {
    const template = getNotificationTemplate(action);
    return {
        action,
        color: template?.color || null,
        ...extraMetadata,
    };
};

const MANUAL_PAYMENT_MODES = ["MANUAL_CHEQUE", "ZELLE"];
const TERMINAL_PAYMENT_OUTCOMES = ["SUCCESS", "FAILED", "REJECTED"];

const buildPaymentMetadata = (payment, previousStatus) => ({
    paymentId: payment._id,
    applicationId: payment.applicationId,
    paymentMode: payment.paymentMode,
    previousStatus,
    currentStatus: payment.status,
    transactionId: payment.transactionId || null,
});

const notifyPaymentSuccessful = async (payment, metadata) =>
    exports.notifyUser(payment.userId, NOTIFICATION_ACTIONS.PAYMENT_SUCCESSFUL, metadata);

const hasApplicationSubmissionNotification = async (userId, applicationId) => {
    const existing = await UserNotification.findOne({
        userId,
        isDeleted: { $ne: true },
        "metadata.action": NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED,
        "metadata.applicationId": String(applicationId),
    })
        .select("_id")
        .lean();

    return Boolean(existing);
};

exports.notifyUserPaymentSubmitted = async (payment) => {
    if (!payment?.userId || !payment?.applicationId) {
        return { skipped: true, reason: "Invalid payment record" };
    }

    if (await hasApplicationSubmissionNotification(payment.userId, payment.applicationId)) {
        return { skipped: true, reason: "Application submission already notified" };
    }

    const application = await Application.findById(payment.applicationId)
        .select("applicationIdentifier")
        .lean();

    const metadata = {
        ...buildPaymentMetadata(payment, null),
        applicationIdentifier: application?.applicationIdentifier || null,
    };

    return exports.notifyUser(
        payment.userId,
        NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED,
        metadata
    );
};

const formatStatusLabel = (status) => getCanonicalStatus(status).replace(/_/g, " ");

const buildApplicationStatusMessage = (baseMessage, toStatus) => {
    const statusLabel = formatStatusLabel(toStatus);

    if (baseMessage.includes("status has changed")) {
        return baseMessage.replace("status has changed", `${statusLabel} status has changed`);
    }

    return `${baseMessage} ${statusLabel} status is changed.`;
};

exports.buildApplicationStatusMessage = buildApplicationStatusMessage;

exports.notifyUser = async (userId, action, extraMetadata = {}) => {
    const template = getNotificationTemplate(action);
    if (!template) {
        return { skipped: true, reason: `Unknown notification action: ${action}` };
    }

    const { messageOverride, ...metadataFields } = extraMetadata;
    const message = messageOverride || template.message;
    const metadata = buildMetadata(action, metadataFields);

    await UserNotification.create({
        userId,
        title: template.title,
        message,
        type: template.type,
        metadata,
    });

    return sendPushNotificationToUser(userId, {
        title: template.title,
        message,
        data: stringifyData(metadata),
    });
};

exports.notifyUsers = async (users = [], action, extraMetadata = {}) => {
    const template = getNotificationTemplate(action);
    if (!template) {
        return { skipped: true, reason: `Unknown notification action: ${action}` };
    }
    if (!users.length) {
        return { skipped: true, reason: "No recipients provided" };
    }

    const metadata = buildMetadata(action, extraMetadata);

    await UserNotification.insertMany(
        users.map((user) => ({
            userId: user._id,
            title: template.title,
            message: template.message,
            type: template.type,
            metadata,
        })),
        { ordered: false }
    );

    return sendPushNotificationToUsers(users, {
        title: template.title,
        message: template.message,
        data: stringifyData(metadata),
    });
};

exports.notifyAllActiveUsers = async (action, extraMetadata = {}) => {
    const users = await AppUser.find({
        isDeleted: { $ne: true },
        status: "active",
    })
        .select("_id fcmToken fcmTokens deviceToken deviceTokens")
        .lean();

    return exports.notifyUsers(users, action, extraMetadata);
};

const notifyApplicationStatusUser = (application, action, canonicalTo, metadata) => {
    const template = getNotificationTemplate(action);
    const message = buildApplicationStatusMessage(template.message, canonicalTo);

    return exports.notifyUser(application.userId, action, {
        ...metadata,
        messageOverride: message,
    });
};

exports.notifyApplicationStatusChange = async (application, fromStatus, toStatus) => {
    const canonicalFrom = getCanonicalStatus(fromStatus);
    const canonicalTo = getCanonicalStatus(toStatus);
    const metadata = {
        applicationId: application._id,
        fromStatus: canonicalFrom,
        toStatus: canonicalTo,
    };

    if (canonicalTo === "UNDER_REVIEW") {
        return notifyApplicationStatusUser(
            application,
            NOTIFICATION_ACTIONS.APPLICATION_UNDER_REVIEW,
            canonicalTo,
            metadata
        );
    }
    if (canonicalTo === "VISA_ISSUED") {
        return notifyApplicationStatusUser(
            application,
            NOTIFICATION_ACTIONS.APPLICATION_APPROVED,
            canonicalTo,
            metadata
        );
    }
    if (canonicalTo === "REJECTED") {
        return notifyApplicationStatusUser(
            application,
            NOTIFICATION_ACTIONS.APPLICATION_REJECTED,
            canonicalTo,
            metadata
        );
    }

    return notifyApplicationStatusUser(
        application,
        NOTIFICATION_ACTIONS.APPLICATION_STATUS_CHANGED,
        canonicalTo,
        metadata
    );
};

exports.notifyManualPaymentOutcome = async (payment, previousStatus) => {
    if (!payment || !MANUAL_PAYMENT_MODES.includes(payment.paymentMode)) {
        return { skipped: true, reason: "Not a manual payment" };
    }

    if (payment.status === previousStatus) {
        return { skipped: true, reason: "Payment status unchanged" };
    }

    if (!TERMINAL_PAYMENT_OUTCOMES.includes(payment.status)) {
        return {
            skipped: true,
            reason: "Manual payment notifications are sent only for success or failure",
        };
    }

    const metadata = buildPaymentMetadata(payment, previousStatus);

    if (payment.status === "SUCCESS") {
        return notifyPaymentSuccessful(payment, metadata);
    }

    return exports.notifyUser(payment.userId, NOTIFICATION_ACTIONS.PAYMENT_FAILED, metadata);
};

exports.notifyPaymentStatusChange = async (payment, previousStatus) => {
    if (!payment || payment.status === previousStatus) {
        return { skipped: true, reason: "Payment status unchanged" };
    }

    if (MANUAL_PAYMENT_MODES.includes(payment.paymentMode)) {
        return exports.notifyManualPaymentOutcome(payment, previousStatus);
    }

    const metadata = buildPaymentMetadata(payment, previousStatus);

    if (payment.status === "SUCCESS") {
        return notifyPaymentSuccessful(payment, metadata);
    }

    if (payment.status === "FAILED") {
        return exports.notifyUser(payment.userId, NOTIFICATION_ACTIONS.PAYMENT_FAILED, metadata);
    }

    if (payment.status === "REJECTED") {
        return exports.notifyUser(payment.userId, NOTIFICATION_ACTIONS.PAYMENT_FAILED, metadata);
    }

    return { skipped: true, reason: "No notification mapped for payment status" };
};

exports.notifyDocumentRejected = async ({
    userId,
    applicationId,
    documentId,
    docType,
    reuploadRequestId,
    isAdditionalDocument,
}) => {
    const action = isAdditionalDocument
        ? NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REJECTED
        : NOTIFICATION_ACTIONS.STANDARD_DOCUMENT_REJECTED;

    return exports.notifyUser(userId, action, {
        applicationId,
        documentId,
        docType,
        reuploadRequestId,
    });
};

exports.notifyDocumentAccepted = async ({
    userId,
    applicationId,
    documentId,
    docType,
}) =>
    exports.notifyUser(userId, NOTIFICATION_ACTIONS.DOCUMENT_ACCEPTED, {
        applicationId,
        documentId,
        docType,
    });

exports.notifyAdditionalDocumentRequested = async ({
    userId,
    applicationId,
    requestId,
    parentDocumentId,
    title,
    reason,
}) =>
    exports.notifyUser(userId, NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REQUESTED, {
        applicationId,
        requestId,
        parentDocumentId,
        title,
        reason,
    });
