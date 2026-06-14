const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const InquiryAssignee = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", index: true
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", index: true
        },
        inquiryId: {
            type: mongoose.Schema.Types.ObjectId, ref: "Inquiry", index: true
        }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

InquiryAssignee.plugin(mongoosePaginate);
InquiryAssignee.plugin(aggregatePaginate);

module.exports = mongoose.model("InquiryAssignee", InquiryAssignee);