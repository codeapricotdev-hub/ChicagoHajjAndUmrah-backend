const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Review = new mongoose.Schema(
    {
        personName: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        description: {
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

Review.plugin(mongoosePaginate);
Review.plugin(aggregatePaginate);

module.exports = mongoose.model("Review", Review);

// Person name,
// Year
// Address
// Type: Umrah or Hajj
// Description: (actually review)