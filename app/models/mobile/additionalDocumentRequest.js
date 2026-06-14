const mongoose = require("mongoose");

const additionalDocumentRequestSchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
            index: true,
        },
        applicantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApplicantDetails",
            required: true,
            index: true,
        },
        parentDocumentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApplicationDocument",
            required: true,
            index: true,
        },
        requestedByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["OPEN", "UPLOADED", "APPROVED", "REJECTED", "CANCELLED"],
            default: "OPEN",
            index: true,
        },
        uploadedDocumentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApplicationDocument",
            default: null,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        uploadedAt: {
            type: Date,
            default: null,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

additionalDocumentRequestSchema.index({ applicationId: 1, status: 1, requestedAt: -1 });
additionalDocumentRequestSchema.index(
    { applicationId: 1, applicantId: 1, title: 1, status: 1 },
    { partialFilterExpression: { status: "OPEN" } }
);

module.exports = mongoose.model(
    "AdditionalDocumentRequest",
    additionalDocumentRequestSchema
);
