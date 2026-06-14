const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema(
    {
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NotificationCampaign",
            default: null,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AppUser",
            required: true,
            index: true,
        },
        title: {
            type: String,
            trim: true,
            maxlength: 120,
            default: null,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        type: {
            type: String,
            enum: ["ADMIN_BROADCAST", "APPLICATION", "PAYMENT", "SYSTEM"],
            default: "ADMIN_BROADCAST",
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

userNotificationSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, isDeleted: 1, readAt: 1 });
userNotificationSchema.index({ campaignId: 1, isDeleted: 1 });

module.exports = mongoose.model("UserNotification", userNotificationSchema);
