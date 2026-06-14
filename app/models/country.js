const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Country = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

Country.plugin(mongoosePaginate);
Country.plugin(aggregatePaginate);

module.exports = mongoose.model("Country", Country);