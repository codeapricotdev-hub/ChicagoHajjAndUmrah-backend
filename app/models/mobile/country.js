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
        countryCode: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (value) => /^\+\d{1,4}$/.test(value),
                message: "Country code must be in format +XX (e.g. +91, +1, +44)"
            }
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
