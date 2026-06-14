const mongoose = require("mongoose");

const documentReuploadRequestSchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
            index: true,
        },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApplicationDocument",
            required: true,
            index: true,
        },
        applicantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApplicantDetails",
            required: true,
            index: true,
        },
        requestedByAdminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["OPEN", "FULFILLED", "CANCELLED"],
            default: "OPEN",
            index: true,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

documentReuploadRequestSchema.index(
    { applicationId: 1, documentId: 1, status: 1 },
    { partialFilterExpression: { status: "OPEN" } }
);

module.exports = mongoose.model(
    "DocumentReuploadRequest",
    documentReuploadRequestSchema
);
