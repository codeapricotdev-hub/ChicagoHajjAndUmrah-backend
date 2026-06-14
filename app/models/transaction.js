const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Transaction = new mongoose.Schema(
    {
        inquiryType: {
            type: String,
        },
        paymentLink: {
            type: String,
        },
        inquiryTypeId: {
            type: mongoose.Schema.Types.ObjectId, ref: "Inquiry", index: false
        },
        packageInquiryId: {
            type: mongoose.Schema.Types.ObjectId, ref: "Package", index: false
        },
        transactionAmount: {
            type: String,
            required: false,
        },
        transactionId: {
            type: String,
            required: false,
        },
        paymentStatus: {
            type: String
        },
        mode: {
            type: String
        }
    },
    {
        versionKey: false,
        timestamps: false,
    }
);

Transaction.plugin(mongoosePaginate);
Transaction.plugin(aggregatePaginate);

module.exports = mongoose.model("Transaction", Transaction);