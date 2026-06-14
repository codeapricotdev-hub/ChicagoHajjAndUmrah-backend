const mongoose = require("mongoose");
const validator = require("validator");
const { DOMAIN } = require("../middleware/constant");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const TermsAndCondition = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
        },
        domain:{
            type:String,
            enum: DOMAIN.TYPE,
            required: true,
            default: "chu"
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

TermsAndCondition.plugin(mongoosePaginate);
TermsAndCondition.plugin(aggregatePaginate);

module.exports = mongoose.model("TermsAndCondition", TermsAndCondition);