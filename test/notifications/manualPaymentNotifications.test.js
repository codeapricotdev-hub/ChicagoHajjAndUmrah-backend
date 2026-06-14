const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

const backendRoot = path.join(__dirname, "..", "..");

const read = (relativePath) =>
    fs.readFileSync(path.join(backendRoot, relativePath), "utf8");

describe("Manual Payment Notifications", () => {
    it("defines notifyManualPaymentOutcome for cheque and zelle payments", () => {
        const source = read("app/helpers/mobile/userNotificationService.js");
        expect(source.includes("exports.notifyManualPaymentOutcome")).to.be.true;
        expect(source.includes('MANUAL_PAYMENT_MODES = ["MANUAL_CHEQUE", "ZELLE"]')).to.be
            .true;
    });

    it("sends PAYMENT_FAILED for manual rejected payments", () => {
        const source = read("app/helpers/mobile/userNotificationService.js");
        const manualBlock = source.slice(
            source.indexOf("exports.notifyManualPaymentOutcome"),
            source.indexOf("exports.notifyPaymentStatusChange")
        );
        expect(manualBlock.includes("NOTIFICATION_ACTIONS.PAYMENT_FAILED")).to.be.true;
        expect(manualBlock.includes("NOTIFICATION_ACTIONS.PAYMENT_REJECTED_CHEQUE")).to.be
            .false;
        expect(manualBlock.includes("NOTIFICATION_ACTIONS.PAYMENT_REJECTED_ZELLE")).to.be
            .false;
    });

    it("notifies admin payment updates only for terminal outcomes", () => {
        const source = read("app/controllers/admin/applicationManagement.js");
        expect(source.includes("notifyManualPaymentOutcome")).to.be.true;
        expect(source.includes('["SUCCESS", "FAILED", "REJECTED"].includes(status)')).to.be.true;
    });

    it("notifies application submission when user submits manual payment", () => {
        const source = read("app/controllers/mobile/paymentV2.js");
        expect(source.includes("notifyUserPaymentSubmitted(payment)")).to.be.true;
    });

    it("defines notifyUserPaymentSubmitted for user-initiated payment", () => {
        const source = read("app/helpers/mobile/userNotificationService.js");
        expect(source.includes("exports.notifyUserPaymentSubmitted")).to.be.true;
        expect(source.includes("NOTIFICATION_ACTIONS.APPLICATION_SUBMITTED")).to.be.true;
    });

    it("fires application submitted on stripe checkout completion", () => {
        const source = read("app/helpers/mobile/stripeWebhookHandler.js");
        expect(source.includes("notifyUserPaymentSubmitted")).to.be.true;
    });
});
