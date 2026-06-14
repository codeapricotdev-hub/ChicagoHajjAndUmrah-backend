const mongoose = require("mongoose");

const appCmsPageSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 120,
        },
        value: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AppCmsPage", appCmsPageSchema);
