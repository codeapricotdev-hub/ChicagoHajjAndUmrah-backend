const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const { isTransactionIdentifier } = require("../../helpers/mobile/applicationIdentifier");

const Payment = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },

        paymentMode: {
            type: String,
            enum: ["STRIPE", "MANUAL_CHEQUE", "ZELLE"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "usd",
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "SUCCESS",
                "REJECTED",
                "FAILED",
            ],
            default: "PENDING",
        },
        nameOnCheque: {
            type: String
        },
        depositDate: {
            type: Date
        },
        // Stripe-only
        stripeSessionId: String,
        stripePaymentIntentId: String,
        stripePaymentMethod: String,

        // Manual payments
        proofUrl: String,       // cheque image / zelle screenshot
        proofS3Key: String,

        referenceNumber: String, // cheque no / zelle ref

        adminRemark: String,    // rejection reason

        isReupload: {
            type: Boolean,
            default: false,
            index: true,
        },

    },
    { timestamps: true }
);

Payment.pre("save", function enforceImmutableTransactionId(next) {
    if (!this.isNew && this.isModified("transactionId")) {
        const error = new Error("transactionId cannot be modified after creation");
        error.statusCode = 400;
        return next(error);
    }

    if (this.transactionId && !isTransactionIdentifier(this.transactionId)) {
        const error = new Error("transactionId must use the TXN-YYMMDD-###### format");
        error.statusCode = 400;
        return next(error);
    }

    return next();
});

Payment.plugin(mongoosePaginate);
Payment.plugin(aggregatePaginate);

module.exports = mongoose.model('Payment', Payment);
