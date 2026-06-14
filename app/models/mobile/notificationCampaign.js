const mongoose = require("mongoose");

const notificationCampaignSchema = new mongoose.Schema(
    {
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
        filters: {
            visaTypes: [{ type: String }],
            statuses: [{ type: String }],
            search: { type: String, trim: true, default: null },
            names: [{ type: String, trim: true }],
            emails: [{ type: String, lowercase: true, trim: true }],
            userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "AppUser" }],
            isVerified: { type: Boolean, default: null },
        },
        totalRecipients: {
            type: Number,
            default: 0,
        },
        sentByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

notificationCampaignSchema.index({ createdAt: -1 });
notificationCampaignSchema.index({ sentByAdminId: 1, createdAt: -1 });

module.exports = mongoose.model("NotificationCampaign", notificationCampaignSchema);
