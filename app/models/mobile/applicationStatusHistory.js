const mongoose = require("mongoose");

const applicationStatusHistorySchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
            index: true,
        },
        fromStatus: {
            type: String,
            required: true,
        },
        toStatus: {
            type: String,
            required: true,
        },
        changedByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        changedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AppUser",
            default: null,
        },
        actorType: {
            type: String,
            enum: ["ADMIN", "APP_USER", "SYSTEM"],
            default: "ADMIN",
        },
        note: {
            type: String,
            default: null,
            trim: true,
            maxlength: 500,
        },
        changedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

applicationStatusHistorySchema.index({ applicationId: 1, changedAt: -1 });

module.exports = mongoose.model(
    "ApplicationStatusHistory",
    applicationStatusHistorySchema
);
