const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const VideoGalleryCategory = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

VideoGalleryCategory.plugin(mongoosePaginate);
VideoGalleryCategory.plugin(aggregatePaginate);

module.exports = mongoose.model("VideoGalleryCategory", VideoGalleryCategory);