const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PackageIcon = new mongoose.Schema(
    {
        image: {
            type: String,
            required: false,
            default: null
        },
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

PackageIcon.plugin(mongoosePaginate);
PackageIcon.plugin(aggregatePaginate);

module.exports = mongoose.model("PackageIcon", PackageIcon);