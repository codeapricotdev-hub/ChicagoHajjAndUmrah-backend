const mongoose = require("mongoose");

const applicationDocumentSchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
        },

        applicantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApplicantDetails",
            required: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AppUser",
            required: true,
        },

        docType: {
            type: String,
            enum: [
                "PASSPORT",
                "PHOTO",
                "BIRTH_CERT",
                "VISA",
                "INSURANCE",
                "ITINERARY",
                "MARRAIGE_CERT",
            ],
            required: true,
            index: true,
        },

        additionalRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdditionalDocumentRequest",
            default: null,
            index: true,
        },

        parentDocumentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApplicationDocument",
            default: null,
            index: true,
        },

        displayName: {
            type: String,
            trim: true,
            maxlength: 120,
            default: null,
        },

        fileUrl: String,
        s3Key: String,
        mimeType: String,
        size: Number,
        originalName: String,
        uploadedByRole: {
            type: String,
            enum: ["APPLICANT", "ADMIN"],
            default: "APPLICANT",
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },
        statusChangedAt: {
            type: Date,
            default: Date.now,
        },

        isReupload: {
            type: Boolean,
            default: false,
        },

        reuploadReason: {
            type: String,
            default: null,
        },

        rejectionReason: {
            type: String,
            default: null,
            trim: true,
        },

        version: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);


/**
 * Ensure one base document per application + applicant + docType.
 * Requested additional documents use additionalRequestId and can coexist with
 * base documents without changing the existing review workflow.
 */
applicationDocumentSchema.index(
    { applicationId: 1, applicantId: 1, docType: 1 },
    {
        unique: true,
        partialFilterExpression: { additionalRequestId: null },
    }
);

applicationDocumentSchema.index(
    { applicationId: 1, applicantId: 1, additionalRequestId: 1 },
    {
        unique: true,
        partialFilterExpression: { additionalRequestId: { $type: "objectId" } },
    }
);

module.exports = mongoose.model(
    "ApplicationDocument",
    applicationDocumentSchema
);
