const mongoose = require("mongoose");
const validator = require("validator");
const { DOMAIN } = require("../middleware/constant");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Banner = new mongoose.Schema(
    {
        
        image: {
            type: String,
            required: true,
        },
        mobile_image: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: false,
         
        },
        url: {
            type: String,
            required: false,
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

Banner.plugin(mongoosePaginate);
Banner.plugin(aggregatePaginate);

module.exports = mongoose.model("banners", Banner);