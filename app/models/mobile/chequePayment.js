const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const ChequePayment = new mongoose.Schema(
    {
        notes: {
            type: String,
            required: true,
            trim: true,
        },
        nameOnCheque: {
            type: String,
            required: true,
            trim: true,
        },
        importantNotes: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

ChequePayment.plugin(mongoosePaginate);
ChequePayment.plugin(aggregatePaginate);

module.exports = mongoose.model("ChequePayment", ChequePayment);
