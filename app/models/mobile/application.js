const mongoose = require("mongoose");

const APPLICATION_STATUSES = [
    "DRAFT",
    "SUBMITTED",
    "PAYMENT_VERIFICATION",
    "UNDER_REVIEW",
    "REVIEW",
    "PROCESSING",
    "VISA_ISSUED",
    "APPROVED",
    "REJECTED",
    "APPLICATION SUBMITTED",
    "DOCUMENT REVIEW",
    "VISA PROCESSING",
    "VISA APPROVED",
    "VISA REJECTED",
];

const applicationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AppUser",
            required: true,
        },
        applicationIdentifier: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true,
            index: true,
        },

        visaType: {
            type: String,
            enum: ["UMRAH", "1_YEAR", "5_YEAR", "10_YEAR"],
            required: true,
        },

        status: {
            type: String,
            enum: APPLICATION_STATUSES,
            default: "SUBMITTED",
            index: true,
        },
        statusChangedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

applicationSchema.statics.APPLICATION_STATUSES = APPLICATION_STATUSES;

module.exports = mongoose.model("Application", applicationSchema);
