const mongoose = require("mongoose");
const { INQUARY } = require("../middleware/constant")
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Inquiry = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: INQUARY.TYPE,
            required: true,
            default: "flight"
        },
        fullName: {
            type: String,
            required: false,
            default: null,
        },
        firstName:{
            type: String,
            required: false,
            default: null,
        },
        lastName:{
            type: String,
            required: false,
            default: null,
        },
        email: {
            type: String,
            default: null
        },
        totalTravellers: {
            type: Number,
            default: null
        },
        mobileNumber: {
            type: String,
            default: null
        },
        tripType: {
            type: String,
            enum: INQUARY.TRIP_TYPE,
        },
        multiCity: [
            {
                from: {
                    type: String
                },
                to: {
                    type: String
                },
                depatureDate: {
                    type: Date
                },
            }
        ],
        from: {
            type: String,
            default: null
        },
        to: {
            type: String,
            default: null
        },
        departureDate: {
            type: Date,
            default: null
        },
        returnDate: {
            type: Date,
            default: null
        },
        noOfTravellerType: [
            {
                type: {
                    type: String,
                    enum: INQUARY.NO_OF_TRAVELLER_TYPE
                },
                allowAgeRange: {
                    type: Number,
                },
                members: {
                    type: Number,
                }
            }
        ],

        travelClass: {
            type: String,
            enum: INQUARY.TRAVEL_CLASS,
            default: "Economy"
        },
        roomRating: {
            type: String,
        },
        roomType: [{
            roomType: String,
            noOfRoom: Number,
            _id: false

        }],
        noOfEvisa: {
            type: String,
        },
        nationality: {
            type: [],

        },
        passportType: {
            type: String,
            default: null
        },
        noOfPassports: {
            type: Number,
            default: null
        },
        isDateFixed: {
            type: Boolean,
            default: false
        },
        isDateFlexible: {
            type: Boolean,
            default: false
        },
        us_ca_passports: {
            type: Array,
            default: []
        },
        other_passports: {
            type: Array,
            default: []
        },
        status: {
            type: String,
            default: "Pending"
        },
        comment: {
            type: String,
            default: ""
        },
        message:{
            type:String,
            default:""
        },
        package:{
            type:String,
            default:""
        },
        refId: {
            type: String,
            default: ""
        },
        isAssignee: {
            type: String,
            default: false
        },
        assignedUser: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", index: true,
        },
        extra_option: {
            type: String,
        },
        destination: {
            type: String
        }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

Inquiry.plugin(mongoosePaginate);
Inquiry.plugin(aggregatePaginate);

module.exports = mongoose.model("Inquiry", Inquiry);