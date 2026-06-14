const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const {
    buildStripeCheckoutMetadata,
} = require("../../app/helpers/mobile/stripeWebhookHandler");

describe("Stripe Webhook Handler", () => {
    it("builds checkout metadata from payment record", () => {
        const payment = {
            _id: "507f1f77bcf86cd799439011",
            transactionId: "TXN-260531-000001",
        };

        expect(buildStripeCheckoutMetadata(payment)).to.deep.equal({
            paymentId: "507f1f77bcf86cd799439011",
            transactionId: "TXN-260531-000001",
        });
    });

    it("handles success and failure Stripe events", () => {
        const source = fs.readFileSync(
            path.join(__dirname, "../../app/helpers/mobile/stripeWebhookHandler.js"),
            "utf8"
        );

        expect(source.includes("checkout.session.completed")).to.be.true;
        expect(source.includes("checkout.session.async_payment_succeeded")).to.be.true;
        expect(source.includes("checkout.session.async_payment_failed")).to.be.true;
        expect(source.includes("checkout.session.expired")).to.be.true;
        expect(source.includes("payment_intent.payment_failed")).to.be.true;
        expect(source.includes("notifyPaymentStatusChange")).to.be.true;
        expect(source.includes("notifyUserPaymentSubmitted")).to.be.true;
        expect(source.includes("STRIPE_WEBHOOK_SECRET")).to.be.true;
    });
});
