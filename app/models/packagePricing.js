const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PackagePricing = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        peoplePerRoom: {
            type: Number,
            required: true,
        },
        pricePerPerson: {
            type: String,
            required: true,
        },
        position: {
            type: Number,
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

PackagePricing.plugin(mongoosePaginate);
PackagePricing.plugin(aggregatePaginate);

module.exports = mongoose.model("PackagePricing", PackagePricing);