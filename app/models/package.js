const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Package = new mongoose.Schema(
    {
        title: {
            type: String,
            required: false,
        },
        forType: {
            type: String,
            required: false,
        },
        url: {
            type: String,
            required: false,
        },
        isActive: {
            type: Boolean,
            default: true
        },
        subTitle: {
            type: String,
            required: false,
        },
        shortDescription: {
            type: String,
            required: false,
        },
        englishDate: {
            type: String,
            required: false,
        },
        noOfDays: {
            type: String,
            required: false,
        },
        price: {
            type: String,
            required: false,
        },
        priceCaption: {
            type: String,
            required: false,
        },
        packageType: {
            type: String,
            required: false,
        },
        packageListingImage: {
            type: String,
            required: false,
        },
        packageHeaderImage: {
            type: String,
            required: false,
        },
        umrahSubType: {
            type: String,
            required: false,
            default: ""
        },
        position: {
            type: Number
        },
        slug: { type: String },
        meta_title:{type: String},
        meta_desc:{type: String},
        meta_keywords:{type: String},
        packageIcon: [{
            type: mongoose.Schema.Types.ObjectId, ref: "PackageIcon", index: true
        }],
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

Package.plugin(mongoosePaginate);
Package.plugin(aggregatePaginate);

module.exports = mongoose.model("Package", Package);