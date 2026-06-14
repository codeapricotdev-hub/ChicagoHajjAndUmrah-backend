const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const ImageGallery = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: false,
            default: null
        },
        title: {
            type: String,
            required: true,
        },
        type: { type: mongoose.Schema.Types.ObjectId, ref: "ImageGalleryCategory", index: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        images: [String]
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

ImageGallery.plugin(mongoosePaginate);
ImageGallery.plugin(aggregatePaginate);

module.exports = mongoose.model("ImageGallery", ImageGallery);