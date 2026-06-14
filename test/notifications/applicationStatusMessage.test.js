const { expect } = require("chai");
const { NOTIFICATION_ACTIONS } = require("../../app/helpers/mobile/notificationTemplates");
const {
    buildApplicationStatusMessage,
} = require("../../app/helpers/mobile/userNotificationService");

describe("Application status notification messages", () => {
    it("inserts status into the status-changed sentence", () => {
        const message = buildApplicationStatusMessage(
            "Your application status has changed.",
            "PROCESSING"
        );

        expect(message).to.equal("Your application PROCESSING status has changed.");
    });

    it("appends status is changed for other application messages", () => {
        const message = buildApplicationStatusMessage(
            "Our team is now reviewing your application.",
            "UNDER_REVIEW"
        );

        expect(message).to.equal(
            "Our team is now reviewing your application. UNDER REVIEW status is changed."
        );
    });

    it("appends status for approved and rejected messages", () => {
        const approved = buildApplicationStatusMessage(
            "Your visa application has been approved.",
            "VISA_ISSUED"
        );
        const rejected = buildApplicationStatusMessage(
            "Unfortunately, your application was not approved.",
            "REJECTED"
        );

        expect(approved).to.equal(
            "Your visa application has been approved. VISA ISSUED status is changed."
        );
        expect(rejected).to.equal(
            "Unfortunately, your application was not approved. REJECTED status is changed."
        );
    });
});
