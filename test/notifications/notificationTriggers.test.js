const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const { NOTIFICATION_ACTIONS } = require("../../app/helpers/mobile/notificationTemplates");

const backendRoot = path.join(__dirname, "..", "..");

const read = (relativePath) =>
    fs.readFileSync(path.join(backendRoot, relativePath), "utf8");

const TRIGGER_EXPECTATIONS = [
    {
        action: NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED",
    },
    {
        action: NOTIFICATION_ACTIONS.APPLICATION_UNDER_REVIEW,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.APPLICATION_UNDER_REVIEW",
    },
    {
        action: NOTIFICATION_ACTIONS.APPLICATION_STATUS_CHANGED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.APPLICATION_STATUS_CHANGED",
    },
    {
        action: NOTIFICATION_ACTIONS.STANDARD_DOCUMENT_REJECTED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.STANDARD_DOCUMENT_REJECTED",
    },
    {
        action: NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REQUESTED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REQUESTED",
    },
    {
        action: NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REJECTED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.ADDITIONAL_DOCUMENT_REJECTED",
    },
    {
        action: NOTIFICATION_ACTIONS.DOCUMENT_ACCEPTED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.DOCUMENT_ACCEPTED",
    },
    {
        action: NOTIFICATION_ACTIONS.PAYMENT_SUCCESSFUL,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.PAYMENT_SUCCESSFUL",
    },
    {
        action: NOTIFICATION_ACTIONS.PAYMENT_FAILED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.PAYMENT_FAILED",
    },
    {
        action: NOTIFICATION_ACTIONS.PAYMENT_REJECTED_CHEQUE,
        file: "app/helpers/mobile/notificationTemplates.js",
        needle: "PAYMENT_REJECTED_CHEQUE",
    },
    {
        action: NOTIFICATION_ACTIONS.PAYMENT_REJECTED_ZELLE,
        file: "app/helpers/mobile/notificationTemplates.js",
        needle: "PAYMENT_REJECTED_ZELLE",
    },
    {
        action: NOTIFICATION_ACTIONS.VISA_BOOKING_CONFIRMED,
        file: "app/helpers/mobile/notificationTemplates.js",
        needle: "VISA_BOOKING_CONFIRMED",
    },
    {
        action: NOTIFICATION_ACTIONS.APPLICATION_APPROVED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.APPLICATION_APPROVED",
    },
    {
        action: NOTIFICATION_ACTIONS.APPLICATION_REJECTED,
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "NOTIFICATION_ACTIONS.APPLICATION_REJECTED",
    },
    {
        action: NOTIFICATION_ACTIONS.NEW_PACKAGES_AVAILABLE,
        file: "app/controllers/admin/package.js",
        needle: "NOTIFICATION_ACTIONS.NEW_PACKAGES_AVAILABLE",
    },
    {
        action: NOTIFICATION_ACTIONS.IMPORTANT_UPDATE,
        file: "app/controllers/admin/notificationManagement.js",
        needle: "NOTIFICATION_ACTIONS.IMPORTANT_UPDATE",
    },
    {
        action: NOTIFICATION_ACTIONS.APP_UPDATE_AVAILABLE,
        file: "app/controllers/admin/appCmsPage.js",
        needle: "NOTIFICATION_ACTIONS.APP_UPDATE_AVAILABLE",
    },
];

const CALL_SITE_EXPECTATIONS = [
    {
        label: "application submit on user payment",
        file: "app/helpers/mobile/userNotificationService.js",
        needle: "exports.notifyUserPaymentSubmitted",
    },
    {
        label: "manual payment submission notification",
        file: "app/controllers/mobile/paymentV2.js",
        needle: "notifyUserPaymentSubmitted(payment)",
    },
    {
        label: "admin status change trigger",
        file: "app/controllers/admin/applicationManagement.js",
        needle: "notifyApplicationStatusChange(",
    },
    {
        label: "admin manual payment outcome trigger",
        file: "app/controllers/admin/applicationManagement.js",
        needle: "notifyManualPaymentOutcome(payment, previousStatus)",
    },
    {
        label: "stripe webhook trigger (payment.js)",
        file: "app/controllers/mobile/payment.js",
        needle: "handleStripeWebhook",
    },
    {
        label: "stripe webhook handler notifies on status change",
        file: "app/helpers/mobile/stripeWebhookHandler.js",
        needle: "notifyPaymentStatusChange(payment, previousStatus)",
    },
    {
        label: "stripe webhook route uses shared handler",
        file: "server.js",
        needle: "handleStripeWebhook",
    },
    {
        label: "document rejected trigger",
        file: "app/controllers/admin/applicationManagement.js",
        needle: "notifyDocumentRejected({",
    },
    {
        label: "document accepted trigger",
        file: "app/controllers/admin/applicationManagement.js",
        needle: "notifyDocumentAccepted({",
    },
    {
        label: "additional document requested trigger",
        file: "app/controllers/admin/applicationManagement.js",
        needle: "notifyAdditionalDocumentRequested({",
    },
];

describe("Notification Trigger Wiring", () => {
    TRIGGER_EXPECTATIONS.forEach(({ action, file, needle }) => {
        it(`wires ${action} in ${file}`, () => {
            const source = read(file);
            expect(source.includes(needle), `expected ${needle} in ${file}`).to.be.true;
        });
    });

    CALL_SITE_EXPECTATIONS.forEach(({ label, file, needle }) => {
        it(`calls notification service for ${label}`, () => {
            const source = read(file);
            expect(source.includes(needle), `expected ${needle} in ${file}`).to.be.true;
        });
    });

    it("allows admin application rejection status", () => {
        const source = read("app/controllers/admin/applicationManagement.js");
        expect(source.includes('status !== "REJECTED"')).to.be.true;
        expect(source.includes("NOTIFICATION_ACTIONS.APPLICATION_REJECTED")).to.be.false;
        expect(source.includes("notifyApplicationStatusChange")).to.be.true;
    });

    it("exposes color and action in mobile notification API mapping", () => {
        const source = read("app/controllers/mobile/notification.js");
        expect(source.includes("color: notification.metadata?.color")).to.be.true;
        expect(source.includes("action: notification.metadata?.action")).to.be.true;
    });
});
