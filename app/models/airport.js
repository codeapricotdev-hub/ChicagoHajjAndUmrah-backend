const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Airport = new mongoose.Schema(
    {
        airportId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: false,
            default: null
        },
        city: {
            type: String,
            required: false,
            default: null
        },
        country: {
            type: String,
            required: false,
            default: null
        },
        iata: {
            type: String,
            required: false,
            default: null
        },
        location: {
            type: {
                type: String,
                default: "Point"
            },
            coordinates: {
                type: [],
                default: [0.0, 0.0]
            }
        },
        lat: {
            type: String,
            default: ""
        },
        long: {
            type: String,
            default: ""
        },
        altitude: {
            type: String,
            default: ""
        },
        timezone: {
            type: String,
            default: ""
        },
        dst: {
            type: String,
            default: ""
        },
        databaseTimezone: {
            type: String,
            default: ""
        },
        type: {
            type: String,
            default: ""
        },
        source: {
            type: String,
            default: ""
        },
        icao: {
            type: String,
            default: ""
        },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

Airport.plugin(mongoosePaginate);
Airport.plugin(aggregatePaginate);

module.exports = mongoose.model("Airport", Airport);