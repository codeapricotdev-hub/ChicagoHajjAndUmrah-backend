const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Blog = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: false,
            default: null
        },
        shortDescription: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        slug: {
            type:String
        },
        status: {
            type: String,
            enum: ["publish", "draft"],
            default: "draft",
            required: true,
        },
        show_in_listing: {
          type: Boolean,
          default: true
        },
        meta_title:{type: String},
        meta_desc:{type: String},
        meta_keywords:{type: String},
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

Blog.plugin(mongoosePaginate);
Blog.plugin(aggregatePaginate);

module.exports = mongoose.model("Blog", Blog);