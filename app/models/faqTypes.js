const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const FaqType = new mongoose.Schema(
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

FaqType.plugin(mongoosePaginate);
FaqType.plugin(aggregatePaginate);

module.exports = mongoose.model("FaqType", FaqType);