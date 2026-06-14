const { expect } = require("chai");
const {
    NOTIFICATION_ACTIONS,
    NOTIFICATION_TEMPLATES,
    NOTIFICATION_COLORS,
    getNotificationTemplate,
} = require("../../app/helpers/mobile/notificationTemplates");

const SPEC_MESSAGES = {
    [NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED]:
        "Your visa application has been successfully submitted to our team for review.",
    [NOTIFICATION_ACTIONS.APPLICATION_UNDER_REVIEW]:
        "Our team is now reviewing your application.",
    [NOTIFICATION_ACTIONS.APPLICATION_STATUS_CHANGED]:
        "Your application status has changed.",
    [NOTIFICATION_ACTIONS.STANDARD_DOCUMENT_REJECTED]:
        "Your document was not clear enough.",
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REQUESTED]:
        "We need more documents from you.",
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REJECTED]:
        "The additional document does not meet requirements.",
    [NOTIFICATION_ACTIONS.DOCUMENT_ACCEPTED]:
        "Your submitted document has been verified and accepted.",
    [NOTIFICATION_ACTIONS.PAYMENT_SUCCESSFUL]:
        "Your payment has been successfully processed.",
    [NOTIFICATION_ACTIONS.PAYMENT_FAILED]:
        "Your payment could not be processed.",
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_CHEQUE]:
        "Your cheque payment was rejected.",
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_ZELLE]:
        "Your Zelle payment was rejected.",
    [NOTIFICATION_ACTIONS.VISA_BOOKING_CONFIRMED]:
        "Your visa package booking has been confirmed.",
    [NOTIFICATION_ACTIONS.APPLICATION_APPROVED]:
        "Your visa application has been approved.",
    [NOTIFICATION_ACTIONS.APPLICATION_REJECTED]:
        "Unfortunately, your application was not approved.",
    [NOTIFICATION_ACTIONS.NEW_PACKAGES_AVAILABLE]:
        "New packages are now available for booking.",
    [NOTIFICATION_ACTIONS.IMPORTANT_UPDATE]:
        "Important information about your booking.",
    [NOTIFICATION_ACTIONS.APP_UPDATE_AVAILABLE]:
        "New features and improvements are available.",
};

const SPEC_COLORS = {
    [NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED]: NOTIFICATION_COLORS.GREEN,
    [NOTIFICATION_ACTIONS.APPLICATION_UNDER_REVIEW]: NOTIFICATION_COLORS.BLUE,
    [NOTIFICATION_ACTIONS.APPLICATION_STATUS_CHANGED]: NOTIFICATION_COLORS.BLUE,
    [NOTIFICATION_ACTIONS.STANDARD_DOCUMENT_REJECTED]: NOTIFICATION_COLORS.YELLOW,
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REQUESTED]: NOTIFICATION_COLORS.YELLOW,
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REJECTED]: NOTIFICATION_COLORS.YELLOW,
    [NOTIFICATION_ACTIONS.DOCUMENT_ACCEPTED]: NOTIFICATION_COLORS.GREEN,
    [NOTIFICATION_ACTIONS.PAYMENT_SUCCESSFUL]: NOTIFICATION_COLORS.GREEN,
    [NOTIFICATION_ACTIONS.PAYMENT_FAILED]: NOTIFICATION_COLORS.RED,
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_CHEQUE]: NOTIFICATION_COLORS.RED,
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_ZELLE]: NOTIFICATION_COLORS.RED,
    [NOTIFICATION_ACTIONS.VISA_BOOKING_CONFIRMED]: NOTIFICATION_COLORS.GREEN,
    [NOTIFICATION_ACTIONS.APPLICATION_APPROVED]: NOTIFICATION_COLORS.GREEN,
    [NOTIFICATION_ACTIONS.APPLICATION_REJECTED]: NOTIFICATION_COLORS.RED,
    [NOTIFICATION_ACTIONS.NEW_PACKAGES_AVAILABLE]: NOTIFICATION_COLORS.BLUE,
    [NOTIFICATION_ACTIONS.IMPORTANT_UPDATE]: NOTIFICATION_COLORS.BLUE,
    [NOTIFICATION_ACTIONS.APP_UPDATE_AVAILABLE]: NOTIFICATION_COLORS.BLUE,
};

const SPEC_TYPES = {
    [NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.APPLICATION_UNDER_REVIEW]: "APPLICATION",
    [NOTIFICATION_ACTIONS.APPLICATION_STATUS_CHANGED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.STANDARD_DOCUMENT_REJECTED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REQUESTED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REJECTED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.DOCUMENT_ACCEPTED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.PAYMENT_SUCCESSFUL]: "PAYMENT",
    [NOTIFICATION_ACTIONS.PAYMENT_FAILED]: "PAYMENT",
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_CHEQUE]: "PAYMENT",
    [NOTIFICATION_ACTIONS.PAYMENT_REJECTED_ZELLE]: "PAYMENT",
    [NOTIFICATION_ACTIONS.VISA_BOOKING_CONFIRMED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.APPLICATION_APPROVED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.APPLICATION_REJECTED]: "APPLICATION",
    [NOTIFICATION_ACTIONS.NEW_PACKAGES_AVAILABLE]: "SYSTEM",
    [NOTIFICATION_ACTIONS.IMPORTANT_UPDATE]: "SYSTEM",
    [NOTIFICATION_ACTIONS.APP_UPDATE_AVAILABLE]: "SYSTEM",
};

describe("Notification Templates", () => {
    it("defines all 17 required notification actions", () => {
        expect(Object.keys(SPEC_MESSAGES)).to.have.length(17);
        Object.keys(SPEC_MESSAGES).forEach((action) => {
            expect(NOTIFICATION_TEMPLATES[action], `missing template: ${action}`).to.exist;
        });
    });

    Object.entries(SPEC_MESSAGES).forEach(([action, message]) => {
        it(`uses spec message for ${action}`, () => {
            expect(getNotificationTemplate(action).message).to.equal(message);
        });
    });

    Object.entries(SPEC_COLORS).forEach(([action, color]) => {
        it(`uses spec color for ${action}`, () => {
            expect(getNotificationTemplate(action).color).to.equal(color);
        });
    });

    Object.entries(SPEC_TYPES).forEach(([action, type]) => {
        it(`uses correct inbox type for ${action}`, () => {
            expect(getNotificationTemplate(action).type).to.equal(type);
        });
    });

    it("returns null for unknown actions", () => {
        expect(getNotificationTemplate("UNKNOWN_ACTION")).to.be.null;
    });
});
