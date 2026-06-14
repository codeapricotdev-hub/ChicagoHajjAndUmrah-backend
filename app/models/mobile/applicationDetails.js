const mongoose = require("mongoose");

const applicantDetailsSchema = new mongoose.Schema(
    {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
        },

        fullName: {
            type: String,
            required: true,
        },

        isAdult: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ApplicantDetails", applicantDetailsSchema);