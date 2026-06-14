const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const PackageInquiryAssignee = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", index: true
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", index: true
        },
        inquiryId: {
            type: mongoose.Schema.Types.ObjectId, ref: "PackageInquiry", index: true
        }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

PackageInquiryAssignee.plugin(mongoosePaginate);
PackageInquiryAssignee.plugin(aggregatePaginate);

module.exports = mongoose.model("PackageInquiryAssignee", PackageInquiryAssignee);