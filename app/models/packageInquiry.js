const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PackageInquiry = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: true,
        },
        departureDate: {
            type: Date,
            required: false,
        },
        returnDate: {
            type: Date,
            required: false,
        },
        travellingFrom: {
            type: String,
            required: false,
        },
        perPersonBudget: {
            type: String,
            required: false,
        },
        phoneNumber: {
            type: String,
            required: false,
        },
        briefTravelPlan: {
            type: String,
            required: false,
        },
        isDateFixed: {
            type: Boolean,
            default: false
        },
        isDateFlexible: {
            type: Boolean,
            default: false
        },
        noOfPerson: {
            type: Number,
            default: 1
        },
        packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", index: true },
        status: {
            type: String,
            default: "Pending"
        },
        comment: {
            type: String,
            default: ""
        },
        refId: {
            type: String,
            default: ""
        },
        isAssignee: {
            type: String,
            default: false
        },
        type: {
            type: String
        },
        assignedUser: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", index: true,
        }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

PackageInquiry.plugin(mongoosePaginate);
PackageInquiry.plugin(aggregatePaginate);

module.exports = mongoose.model("PackageInquiry", PackageInquiry);