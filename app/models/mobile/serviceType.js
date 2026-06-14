const mongoose = require("mongoose");

const serviceTypeSchema = new mongoose.Schema(
    {
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String },
        images: [{ type: String }],
        price: { type: Number, required: true },
        processTime: { type: String },

        eligibility: {
            type: String,
            enum: ["US_CITIZEN", "NON_US_CITIZEN", "ALL"],
            required: true,
        },

        category: {
            type: String,
            enum: ["RELIGIOUS", "TOURISM", "BUSINESS"],
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        requirements: {
            type: String,
            default: "",
        },
        importantNotes: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ServiceType", serviceTypeSchema);
