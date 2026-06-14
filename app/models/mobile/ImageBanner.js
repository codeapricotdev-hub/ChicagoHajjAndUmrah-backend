const mongoose = require('mongoose');
const validator = require("validator");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const imageBannerSchema = new mongoose.Schema(
    {
        imageTitle: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    { timestamps: true }
);

imageBannerSchema.plugin(mongoosePaginate);
imageBannerSchema.plugin(aggregatePaginate);

module.exports =
    mongoose.models.ImageBanner ||
    mongoose.model("ImageBanner", imageBannerSchema);
