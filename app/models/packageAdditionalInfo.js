const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PackageAdditionalInfo = new mongoose.Schema(
    {
        tabTitle: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        position: {
            type: Number,
            required: true,
        },
        packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", index: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

PackageAdditionalInfo.plugin(mongoosePaginate);
PackageAdditionalInfo.plugin(aggregatePaginate);

module.exports = mongoose.model("PackageAdditionalInfo", PackageAdditionalInfo);