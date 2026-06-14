const mongoose = require('mongoose');
const validator = require("validator");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const appUserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            unique: true,
            lowercase: true,
            sparse: true
        },
        mobile: {
            type: String,
            unique: true,
            sparse: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        refreshToken: {
            type: String,
        },
        nationality: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AppCountry",
            required: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        },
        pendingMobile: {
            type: String,
            default: null,
            trim: true
        },

        pendingFullName: {
            type: String,
            default: null,
            trim: true
        },
        profilePic: {
            type: String,
            default: null
        },
        profilePicKey: {
            type: String,
            default: null
        },
        fcmTokens: {
            type: [String],
            default: []
        },

        // Legacy/compatibility aliases (older code may reference these)
        fcmToken: {
            type: String,
            default: null,
        },
        deviceToken: {
            type: String,
            default: null,
        },
        deviceTokens: {
            type: [String],
            default: [],
        },

        // Device metadata used for notification + analytics/debugging
        osType: {
            type: String,
            enum: ["android", "ios"],
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
            enum: ["success", "failed", "pending"],
            default: null,
        },
    },
    { timestamps: true }
);


appUserSchema.plugin(mongoosePaginate);
appUserSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('AppUser', appUserSchema);
