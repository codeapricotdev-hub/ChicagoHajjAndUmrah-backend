const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PackageBoxDetail = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: false,
        },
        packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", index: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

PackageBoxDetail.plugin(mongoosePaginate);
PackageBoxDetail.plugin(aggregatePaginate);

module.exports = mongoose.model("PackageBoxDetail", PackageBoxDetail);