const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const MobileInquirySchema = new mongoose.Schema(
    {
        full_name: {
            type: String,
            required: true,
        },
        nationality: {
            type: String,
            required: true,
        },
        country_of_residence: {
            type: String,
            required: true,
        },
        passport_validity: {
            type: String,
            required: true,
        },
        traveling_as: {
            type: String,
            required: true,
            enum: ["Individual", "Family", "Group"]
        },
        umrah_before: {
            type: String,
            required: true,
            enum: ["Yes", "No"]
        },
        travel_month: {
            type: String,
            required: true,
        },
        phone_number: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
        },
        notes: {
            type: String,
            required: false,
            default: ""
        }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

MobileInquirySchema.plugin(mongoosePaginate);

module.exports = mongoose.model("MobileInquiry", MobileInquirySchema);
