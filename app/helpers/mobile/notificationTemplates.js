const NOTIFICATION_COLORS = {
    GREEN: "GREEN",
    BLUE: "BLUE",
    YELLOW: "YELLOW",
    RED: "RED",
};

const NOTIFICATION_ACTIONS = {
    APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED",
    APPLICATION_UNDER_REVIEW: "APPLICATION_UNDER_REVIEW",
    APPLICATION_STATUS_CHANGED: "APPLICATION_STATUS_CHANGED",
    STANDARD_DOCUMENT_REJECTED: "STANDARD_DOCUMENT_REJECTED",
    ADDITIONAL_DOCUMENT_REQUESTED: "ADDITIONAL_DOCUMENT_REQUESTED",
    ADDITIONAL_DOCUMENT_REJECTED: "ADDITIONAL_DOCUMENT_REJECTED",
    DOCUMENT_ACCEPTED: "DOCUMENT_ACCEPTED",
    PAYMENT_SUCCESSFUL: "PAYMENT_SUCCESSFUL",
    PAYMENT_FAILED: "PAYMENT_FAILED",
    PAYMENT_REJECTED_CHEQUE: "PAYMENT_REJECTED_CHEQUE",
    PAYMENT_REJECTED_ZELLE: "PAYMENT_REJECTED_ZELLE",
    VISA_BOOKING_CONFIRMED: "VISA_BOOKING_CONFIRMED",
    APPLICATION_APPROVED: "APPLICATION_APPROVED",
    APPLICATION_REJECTED: "APPLICATION_REJECTED",
    NEW_PACKAGES_AVAILABLE: "NEW_PACKAGES_AVAILABLE",
    IMPORTANT_UPDATE: "IMPORTANT_UPDATE",
    APP_UPDATE_AVAILABLE: "APP_UPDATE_AVAILABLE",
};

const NOTIFICATION_TEMPLATES = {
    [NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED]: {
        title: "Application Submitted",
        message:
            "Your visa application has been successfully submitted to our team for review.",
        color: NOTIFICATION_COLORS.GREEN,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.APPLICATION_UNDER_REVIEW]: {
        title: "Application Under Review",
        message: "Our team is now reviewing your application.",
        color: NOTIFICATION_COLORS.BLUE,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.APPLICATION_STATUS_CHANGED]: {
        title: "Application Status Updated",
        message: "Your application status has changed.",
        color: NOTIFICATION_COLORS.BLUE,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.STANDARD_DOCUMENT_REJECTED]: {
        title: "Document Rejected",
        message: "Your document was not clear enough.",
        color: NOTIFICATION_COLORS.YELLOW,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REQUESTED]: {
        title: "Additional Documents Needed",
        message: "We need more documents from you.",
        color: NOTIFICATION_COLORS.YELLOW,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REJECTED]: {
        title: "Additional Document Rejected",
        message: "The additional document does not meet requirements.",
        color: NOTIFICATION_COLORS.YELLOW,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.DOCUMENT_ACCEPTED]: {
        title: "Document Accepted",
        message: "Your submitted document has been verified and accepted.",
        color: NOTIFICATION_COLORS.GREEN,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.PAYMENT_SUCCESSFUL]: {
        title: "Payment Successful",
        message: "Your payment has been successfully processed.",
        color: NOTIFICATION_COLORS.GREEN,
        type: "PAYMENT",
    },
    [NOTIFICATION_ACTIONS.PAYMENT_FAILED]: {
        title: "Payment Failed",
        message: "Your payment could not be processed.",
        color: NOTIFICATION_COLORS.RED,
        type: "PAYMENT",
    },
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_CHEQUE]: {
        title: "Cheque Payment Rejected",
        message: "Your cheque payment was rejected.",
        color: NOTIFICATION_COLORS.RED,
        type: "PAYMENT",
    },
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_ZELLE]: {
        title: "Zelle Payment Rejected",
        message: "Your Zelle payment was rejected.",
        color: NOTIFICATION_COLORS.RED,
        type: "PAYMENT",
    },
    [NOTIFICATION_ACTIONS.VISA_BOOKING_CONFIRMED]: {
        title: "Booking Confirmed",
        message: "Your visa package booking has been confirmed.",
        color: NOTIFICATION_COLORS.GREEN,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.APPLICATION_APPROVED]: {
        title: "Application Approved",
        message: "Your visa application has been approved.",
        color: NOTIFICATION_COLORS.GREEN,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.APPLICATION_REJECTED]: {
        title: "Application Rejected",
        message: "Unfortunately, your application was not approved.",
        color: NOTIFICATION_COLORS.RED,
        type: "APPLICATION",
    },
    [NOTIFICATION_ACTIONS.NEW_PACKAGES_AVAILABLE]: {
        title: "New Packages Available",
        message: "New packages are now available for booking.",
        color: NOTIFICATION_COLORS.BLUE,
        type: "SYSTEM",
    },
    [NOTIFICATION_ACTIONS.IMPORTANT_UPDATE]: {
        title: "Important Update",
        message: "Important information about your booking.",
        color: NOTIFICATION_COLORS.BLUE,
        type: "SYSTEM",
    },
    [NOTIFICATION_ACTIONS.APP_UPDATE_AVAILABLE]: {
        title: "App Update Available",
        message: "New features and improvements are available.",
        color: NOTIFICATION_COLORS.BLUE,
        type: "SYSTEM",
    },
};

const getNotificationTemplate = (action) => NOTIFICATION_TEMPLATES[action] || null;

module.exports = {
    NOTIFICATION_COLORS,
    NOTIFICATION_ACTIONS,
    NOTIFICATION_TEMPLATES,
    getNotificationTemplate,
};
