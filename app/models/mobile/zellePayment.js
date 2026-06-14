const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const ZellePayment = new mongoose.Schema(
    {
        qrcode: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: validator.isEmail,
                message: "Please provide a valid email",
            },
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: (value) => /^\d{10}$/.test(value),
                message: "Phone number must be 10 digits",
            },
        },
        instructionTemplate: {
            type: String, // Plain text template (recommended) using placeholders like {{price}}, {{referenceId}}
            default: "",
        },
    },
    { timestamps: true }
);

ZellePayment.plugin(mongoosePaginate);
ZellePayment.plugin(aggregatePaginate);

module.exports = mongoose.model("ZellePayment", ZellePayment);
