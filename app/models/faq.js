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
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
        faqType: { type: mongoose.Schema.Types.ObjectId, ref: "FaqType", index: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

Blog.plugin(mongoosePaginate);
Blog.plugin(aggregatePaginate);

module.exports = mongoose.model("Faq", Blog);