const mongoose = require('mongoose');
const validator = require("validator");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const countrySchema = new mongoose.Schema(
    {
        countryName: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    { timestamps: true }
);

countrySchema.plugin(mongoosePaginate);
countrySchema.plugin(aggregatePaginate);

module.exports = mongoose.model("AppCountry", countrySchema);
