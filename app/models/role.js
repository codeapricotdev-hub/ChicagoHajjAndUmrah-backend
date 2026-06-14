const mongoose = require("mongoose");
const validator = require("validator");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Role = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        permissions: [
            {
                title: { type: String },
                actions: {
                    view: {
                        type: Boolean,
                    },
                    edit: {
                        type: Boolean,
                    },
                    delete: {
                        type: Boolean,
                    },
                    create: {
                        type: Boolean,
                    },
                    loginAccess: {
                        type: Boolean,
                    },
                }
            },
        ]
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

Role.plugin(mongoosePaginate);
Role.plugin(aggregatePaginate);

module.exports = mongoose.model("Role", Role);