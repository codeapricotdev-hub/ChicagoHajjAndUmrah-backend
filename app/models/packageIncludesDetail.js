const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PackageIncludeDetail = new mongoose.Schema(
    {
        icon: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: true,
        },
        packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", index: true },
        packageIcon:[{
            type: mongoose.Schema.Types.ObjectId, ref: "PackageIcon", index: true
        }],
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

PackageIncludeDetail.plugin(mongoosePaginate);
PackageIncludeDetail.plugin(aggregatePaginate);

module.exports = mongoose.model("PackageIncludeDetail", PackageIncludeDetail);