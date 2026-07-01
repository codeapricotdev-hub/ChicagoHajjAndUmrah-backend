const mongoose = require('mongoose');
const validator = require("validator");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const otpSchema = new mongoose.Schema(
    {
        email: String,
        mobile: String,
        otp: String,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AppUser",
            default: null
        },
        purpose: {
            type: String,
            enum: ["register", "login", "forgot-password", "change-password", "change-mobile"],
        },
        expiresAt: Date,

        // Device metadata captured during OTP request and applied on verify-otp
        deviceToken: {
            type: String,
            default: null,
        },
        osType: {
            type: String,
            enum: ["android", "ios", null],
            default: null,
        },
        osVersion: {
            type: String,
            default: null,
        },
        deviceManufacturer: {
            type: String,
            default: null,
        },
        notificationsEnabled: {
            type: Boolean,
            default: null,
        },
        firebaseSdkVersion: {
            type: String,
            default: null,
        },
        lastDeliveryStatus: {
            type: String,
            enum: ["success", "failed", "pending", null],
            default: null,
        },
    },
    { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.plugin(mongoosePaginate);
otpSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('OTP', otpSchema);
