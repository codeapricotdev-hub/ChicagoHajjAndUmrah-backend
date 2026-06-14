const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const ImageGallery = new mongoose.Schema(
    {
        gallery: [],
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        imageGalleryId: { type: mongoose.Schema.Types.ObjectId, ref: "ImageGallery", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

ImageGallery.plugin(mongoosePaginate);
ImageGallery.plugin(aggregatePaginate);

module.exports = mongoose.model("ImageGalleryBunch", ImageGallery);