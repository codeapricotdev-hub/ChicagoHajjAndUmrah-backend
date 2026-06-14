const mongoose = require("mongoose");

const applicationAuditLogSchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        actorType: {
            type: String,
            enum: ["ADMIN", "APPLICANT", "SYSTEM"],
            required: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: false }
);

applicationAuditLogSchema.index({ applicationId: 1, createdAt: -1 });

module.exports = mongoose.model("ApplicationAuditLog", applicationAuditLogSchema);
