const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const AppUser = require("../../models/appUser");
const AppCountry = require("../../models/mobile/country");
const Otp = require("../../models/mobile/otp");
const smtp = require("../../helpers/mail");
const smsHelper = require("../../helpers/sms");

const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const DEVICE_OS_TYPES = ["android", "ios"];
const LAST_DELIVERY_STATUSES = ["success", "failed", "pending"];

const validationError = (message) => {
    const err = new Error(message);
    err.isValidationError = true;
    return err;
};

const sendError = (res, status, message) =>
    res.status(status).json({ success: false, message });

const handleControllerError = (res, err, context) => {
    console.error(`${context} Error:`, err);

    if (err?.isValidationError) {
        return sendError(res, 400, err.message);
    }

    if (err?.name === "ValidationError") {
        return sendError(res, 400, err.message);
    }

    if (err?.name === "CastError") {
        return sendError(res, 400, "Invalid request data");
    }

    if (err?.code === 11000) {
        if (err.keyPattern?.email || err.message?.includes("email")) {
            return sendError(res, 409, "Email already exists.");
        }
        if (err.keyPattern?.mobile || err.message?.includes("mobile")) {
            return sendError(res, 409, "Mobile number already registered.");
        }
        return sendError(res, 409, "Duplicate entry");
    }

    return sendError(res, 500, err.message || "Internal server error");
};

const normalizeLooseOptionalString = (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
};

const normalizeOptionalString = (value, fieldName) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string") throw validationError(`${fieldName} must be a string`);
    const trimmed = value.trim();
    if (!trimmed) throw validationError(`${fieldName} must not be empty`);
    return trimmed;
};

const normalizeOptionalEnum = (value, allowed, fieldName) => {
    const str = normalizeOptionalString(value, fieldName);
    if (str === undefined) return undefined;
    const lowered = str.toLowerCase();
    if (!allowed.includes(lowered)) {
        throw validationError(`${fieldName} must be one of: ${allowed.join(", ")}`);
    }
    return lowered;
};

const normalizeOptionalBoolean = (value, fieldName) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const lowered = value.trim().toLowerCase();
        if (lowered === "true") return true;
        if (lowered === "false") return false;
    }
    throw validationError(`${fieldName} must be boolean`);
};

const extractDeviceMetadata = (source = {}) => {
    const tokenValue = source.deviceToken ?? source.fcmToken;
    const meta = {};

    const deviceToken = normalizeLooseOptionalString(tokenValue);
    if (deviceToken !== undefined) meta.deviceToken = deviceToken;

    if (source.osType !== undefined && source.osType !== null && source.osType !== "") {
        meta.osType = normalizeOptionalEnum(source.osType, DEVICE_OS_TYPES, "osType");
    }

    const osVersion = normalizeLooseOptionalString(source.osVersion);
    if (osVersion !== undefined) meta.osVersion = osVersion;

    const deviceManufacturer = normalizeLooseOptionalString(source.deviceManufacturer);
    if (deviceManufacturer !== undefined) meta.deviceManufacturer = deviceManufacturer;

    if (
        source.notificationsEnabled !== undefined &&
        source.notificationsEnabled !== null &&
        source.notificationsEnabled !== ""
    ) {
        meta.notificationsEnabled = normalizeOptionalBoolean(
            source.notificationsEnabled,
            "notificationsEnabled"
        );
    }

    const firebaseSdkVersion = normalizeLooseOptionalString(source.firebaseSdkVersion);
    if (firebaseSdkVersion !== undefined) meta.firebaseSdkVersion = firebaseSdkVersion;

    if (
        source.lastDeliveryStatus !== undefined &&
        source.lastDeliveryStatus !== null &&
        source.lastDeliveryStatus !== ""
    ) {
        meta.lastDeliveryStatus = normalizeOptionalEnum(
            source.lastDeliveryStatus,
            LAST_DELIVERY_STATUSES,
            "lastDeliveryStatus"
        );
    }

    return meta;
};

const mergeDeviceMetadata = (stored = {}, incoming = {}) => {
    const merged = { ...stored };
    const keys = [
        "deviceToken",
        "osType",
        "osVersion",
        "deviceManufacturer",
        "notificationsEnabled",
        "firebaseSdkVersion",
        "lastDeliveryStatus",
    ];
    for (const key of keys) {
        if (incoming[key] !== undefined) merged[key] = incoming[key];
    }
    return merged;
};

const applyDeviceMetadataToUser = (user, meta = {}) => {
    if (!user || !meta) return;

    if (meta.deviceToken !== undefined) {
        user.deviceToken = meta.deviceToken;
        user.fcmToken = meta.deviceToken;

        // Keep legacy multi-token arrays in sync
        if (!user.fcmTokens) user.fcmTokens = [];
        if (!user.fcmTokens.includes(meta.deviceToken)) user.fcmTokens.push(meta.deviceToken);

        if (!user.deviceTokens) user.deviceTokens = [];
        if (!user.deviceTokens.includes(meta.deviceToken))
            user.deviceTokens.push(meta.deviceToken);
    }

    if (meta.osType !== undefined) user.osType = meta.osType;
    if (meta.osVersion !== undefined) user.osVersion = meta.osVersion;
    if (meta.deviceManufacturer !== undefined) user.deviceManufacturer = meta.deviceManufacturer;
    if (meta.notificationsEnabled !== undefined)
        user.notificationsEnabled = meta.notificationsEnabled;
    if (meta.firebaseSdkVersion !== undefined) user.firebaseSdkVersion = meta.firebaseSdkVersion;
    if (meta.lastDeliveryStatus !== undefined) user.lastDeliveryStatus = meta.lastDeliveryStatus;
};

const pickDefined = (obj = {}) =>
    Object.keys(obj).reduce((acc, key) => {
        if (obj[key] !== undefined) acc[key] = obj[key];
        return acc;
    }, {});

const normalizePurpose = (purpose) =>
    purpose === "forgot_password" ? "forgot-password" : purpose;

const getRuntimeEnv = () =>
    (process.env.NODE_ENV || "DEV").trim().split(/\s+/)[0];

const deliverOtp = async ({ email, mobile, otp }) => {
    const attempts = [];
    const failures = [];
    const errors = {};

    if (email) {
        attempts.push("email");
        try {
            await smtp.sendOtpEmail(email, otp);
        } catch (error) {
            console.error("Send OTP Email Error:", error.message);
            failures.push("email");
            errors.email = error.message;
        }
    }

    if (mobile) {
        attempts.push("sms");
        try {
            await smsHelper.sendOtpSms(mobile, otp);
        } catch (error) {
            console.error("Send OTP SMS Error:", error.message);
            failures.push("sms");
            errors.sms = error.message;
        }
    }

    return {
        delivered: attempts.length > failures.length,
        attempts,
        failures,
        errors,
    };
};

const buildMobileQuery = (mobile) => {
    const variants = smsHelper.getMobileLookupVariants(mobile);
    if (!variants.length) return null;
    return { mobile: { $in: variants } };
};

const findUserByEmailOrMobile = async (email, mobile) => {
    const orConditions = [];

    if (email) {
        orConditions.push({ email });
    }

    const mobileQuery = buildMobileQuery(mobile);
    if (mobileQuery) {
        orConditions.push(mobileQuery);
    }

    if (!orConditions.length) return null;

    return AppUser.findOne({ $or: orConditions });
};

/* ================= SEND OTP (CORE) ================= */
exports.sendOtp = async (req, res) => {
    try {
        const { fullName, email, mobile, purpose: rawPurpose } = req.body;
        const purpose = normalizePurpose(rawPurpose);
        const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
        const normalizedMobile = mobile
            ? smsHelper.normalizePhoneForTwilio(mobile)
            : undefined;

        if (!normalizedEmail && !normalizedMobile)
            return res.status(400).json({ message: "Email or mobile required" });

        if (purpose === "register" && !fullName)
            return res.status(400).json({ message: "Full name required" });

        const allowedPurposes = ["register", "login", "forgot-password", "change-password"];
        if (!allowedPurposes.includes(purpose))
            return res.status(400).json({ message: "Invalid purpose" });

        let matchedUser = null;

        if (purpose === "register") {
            matchedUser = await findUserByEmailOrMobile(
                normalizedEmail,
                normalizedMobile
            );

            if (matchedUser) {
                if (normalizedEmail && matchedUser.email === normalizedEmail) {
                    return sendError(res, 409, "Email already exists.");
                }
                if (
                    normalizedMobile &&
                    smsHelper.getMobileLookupVariants(matchedUser.mobile).some((variant) =>
                        smsHelper.getMobileLookupVariants(normalizedMobile).includes(variant)
                    )
                ) {
                    return sendError(res, 409, "Mobile number already registered.");
                }
            }
        } else {
            matchedUser = await findUserByEmailOrMobile(
                normalizedEmail,
                normalizedMobile
            );

            if (!matchedUser)
                return sendError(res, 404, "User not found.");
        }

        const deliveryEmail = normalizedEmail || matchedUser?.email;
        const deliveryMobile = normalizedMobile ||
            (matchedUser?.mobile
                ? smsHelper.normalizePhoneForTwilio(matchedUser.mobile)
                : undefined);

        // Delete old OTPs
        const filter = { purpose };
        if (normalizedEmail) filter.email = normalizedEmail;
        if (normalizedMobile) {
            const mobileVariants = smsHelper.getMobileLookupVariants(normalizedMobile);
            filter.mobile = mobileVariants.length === 1
                ? mobileVariants[0]
                : { $in: mobileVariants };
        }

        await Otp.deleteMany(filter);

        const otp = generateOtp().toString();

        const deviceMeta = extractDeviceMetadata(req.body);

        await Otp.create({
            email: normalizedEmail,
            mobile: normalizedMobile,
            otp,
            purpose,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            ...pickDefined(deviceMeta),
        });

        const delivery = await deliverOtp({
            email: deliveryEmail,
            mobile: deliveryMobile,
            otp,
        });

        // Registration must succeed even when SMS/email delivery fails.
        // OTP is already persisted; client can resend or use non-prod otp field.
        const allowDeliveryFailure = purpose === "register";

        if (!delivery.delivered && !allowDeliveryFailure) {
            const smsFailed = delivery.failures.includes("sms");
            const emailFailed = delivery.failures.includes("email");
            let message = "Unable to deliver OTP. Please try again later.";

            if (smsFailed && deliveryMobile) {
                message = delivery.errors.sms || message;
            } else if (emailFailed && deliveryEmail) {
                message = delivery.errors.email || message;
            }

            const runtimeEnv = getRuntimeEnv();

            if (runtimeEnv === "PROD" || (deliveryMobile && runtimeEnv !== "test")) {
                return res.status(503).json({
                    success: false,
                    message,
                });
            }

            console.warn(
                "OTP delivery skipped in non-production environment:",
                delivery.failures.join(", ")
            );
        } else if (!delivery.delivered && allowDeliveryFailure) {
            console.warn(
                "Registration OTP delivery failed (continuing):",
                delivery.failures.join(", "),
                delivery.errors
            );
        }

        const response = {
            success: true,
            message: delivery.delivered
                ? "OTP sent successfully"
                : allowDeliveryFailure
                    ? "Registration OTP created. Delivery pending — please use resend if needed."
                    : "OTP sent successfully",
        };

        // Expose OTP only in non-production environments for QA/debugging.
        if (getRuntimeEnv() !== "PROD") {
            response.otp = otp;
            if (!delivery.delivered) {
                response.deliverySkipped = true;
            }
        }

        return res.json(response);

    } catch (err) {
        return handleControllerError(res, err, "Send OTP");
    }
};


// exports.refreshAccessToken = async (req, res) => {
//     try {
//         const { refreshToken } = req.body;

//         if (!refreshToken)
//             return res.status(401).json({ message: "Refresh token required" });

//         const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

//         const user = await AppUser.findById(decoded.userId);

//         if (!user || user.refreshToken !== refreshToken)
//             return res.status(403).json({ message: "Invalid refresh token" });

//         const newAccessToken = jwt.sign(
//             { userId: user._id, role: "USER" },
//             process.env.JWT_SECRET,
//             { expiresIn: "24h" }
//         );

//         return res.json({
//             success: true,
//             token: newAccessToken,
//             accessToken: newAccessToken,
//         });

//     } catch (err) {
//         return res.status(403).json({ message: "Invalid or expired refresh token" });
//     }
// };

exports.refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        // ✅ 1. Check token
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required"
            });
        }

        // ✅ 2. Verify token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        } catch (err) {
            return res.status(403).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        // ✅ 3. Validate token type
        if (decoded.type !== "refresh") {
            return res.status(403).json({
                success: false,
                message: "Invalid token type"
            });
        }

        // ✅ 4. Find user
        const user = await AppUser.findById(decoded.userId).select("+refreshToken");

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // ✅ 5. Generate new access token
        const newAccessToken = jwt.sign(
            { userId: user._id, role: "USER", type: "access" },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        // ✅ 6. Generate new refresh token (ROTATION)
        const newRefreshToken = jwt.sign(
            { userId: user._id, type: "refresh" },
            process.env.REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ 7. Replace old refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (err) {
        console.error("Refresh Token Error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

/* ================= VERIFY OTP ================= */
// exports.verifyOtp = async (req, res) => {
//     try {
//         let user;
//         const { email, mobile, otp, purpose, fullName, password, nationality, changeMobile, changeName } = req.body;
//         const emailValue = email?.trim() || undefined;
//         const mobileValue = mobile?.trim() || undefined;
//         const otpValue = otp?.toString();

//         let record;
//         if (purpose == "register" && !nationality) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Nationality is required"
//             });
//         }

//         if (emailValue) {
//             record = await Otp.findOne({
//                 email: emailValue,
//                 otp: otpValue,
//                 purpose,
//                 expiresAt: { $gt: new Date() }
//             });
//         } else if (mobileValue) {
//             record = await Otp.findOne({
//                 mobile: mobileValue,
//                 otp: otpValue,
//                 purpose,
//                 expiresAt: { $gt: new Date() }
//             });
//         }
//         console.log(record)
//         if (!record)
//             return res.status(400).json({ message: "Invalid or expired OTP" });

//         // OTP should be single-use
//         await Otp.deleteOne({ _id: record._id });

//         user = await AppUser.findOne({
//             $or: [
//                 email ? { email } : null,
//                 mobile ? { mobile } : null
//             ].filter(Boolean)
//         }).select("+password");


//         console.log(user)
//         // REGISTER
//         if (!user && purpose === "register") {
//             if (!password)
//                 return res.status(400).json({ message: "Password required" });

//             const hashedPassword = await bcrypt.hash(password, 10);

//             user = await AppUser.create({
//                 fullName,
//                 email,
//                 mobile,
//                 password: hashedPassword,
//                 isVerified: true,
//                 nationality: nationality
//             });
//         }

//         // LOGIN
//         if (user && purpose === "login") {

//             if (emailValue) {
//                 if (!password)
//                     return res.status(400).json({ message: "Password required" });

//                 const isMatch = await bcrypt.compare(password, user.password);
//                 if (!isMatch)
//                     return res.status(400).json({ message: "Invalid password" });
//             }
//         }

//         // CHANGE PASSWORD
//         if (user && purpose === "change-password") {
//             const { password, newPassword, confirmPassword } = req.body;

//             const isMatch = await bcrypt.compare(password, user.password);
//             if (!isMatch)
//                 return res.status(400).json({ message: "Current Passowrd is incorrect" });

//             if (!newPassword || !confirmPassword) {
//                 return res.status(400).json({ message: "New password and confirm password required" });
//             }

//             if (newPassword !== confirmPassword) {
//                 return res.status(400).json({ message: "Passwords do not match" });
//             }

//             if (newPassword.length < 6) {
//                 return res.status(400).json({ message: "Password must be at least 6 characters" });
//             }

//             user.password = await bcrypt.hash(newPassword, 10);
//         }

//         // after OTP validated + deleteOne

//         if (purpose === "change-mobile") {

//             const user = await AppUser.findById(record.userId)
//                 .select("+pendingMobile +pendingFullName");

//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     message: "User not found"
//                 });
//             }

//             if (!user.pendingMobile) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "No pending profile update found"
//                 });
//             }

//             const taken = await AppUser.findOne({
//                 mobile: user.pendingMobile,
//                 _id: { $ne: user._id }
//             });

//             if (taken) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Phone number already in use"
//                 });
//             }

//             user.mobile = user.pendingMobile;

//             if (user.pendingFullName) {
//                 user.fullName = user.pendingFullName;
//             }

//             user.pendingMobile = null;
//             user.pendingFullName = null;

//             await user.save();

//             return res.json({
//                 success: true,
//                 message: "Profile updated successfully",
//                 user: {
//                     id: user._id,
//                     fullName: user.fullName,
//                     email: user.email,
//                     mobile: user.mobile
//                 }
//             });
//         }

//         const token = jwt.sign(
//             { userId: user._id, role: "USER" },
//             process.env.JWT_SECRET,
//             { expiresIn: "24h" }
//         );
//         const refreshToken = jwt.sign(
//             { userId: user._id, type: "refresh" },
//             process.env.REFRESH_SECRET,
//             { expiresIn: "7d" }
//         );

//         // Save refresh token in DB
//         user.refreshToken = refreshToken;
//         await user.save();

//         return res.json({
//             success: true,
//             token,
//             user: {
//                 id: user._id,
//                 fullName: user.fullName,
//                 email: user.email,
//                 mobile: user.mobile,
//                 isVerified: user.isVerified
//             }
//         });
//     } catch (err) {
//         return res.status(500).json({ message: err.message });
//     }
// };
exports.verifyOtp = async (req, res) => {
    try {

        let user;

        const {
            email,
            mobile,
            otp,
            purpose,
            fullName,
            password,
            nationality
        } = req.body;

        const emailValue = email?.trim()?.toLowerCase() || undefined;
        const mobileValue = mobile
            ? smsHelper.normalizePhoneForTwilio(mobile)
            : undefined;
        const otpValue = otp?.toString();

        const normalizedPurpose = purpose === "forgot_password" ? "forgot-password" : purpose;

        if (normalizedPurpose === "register" && !nationality) {
            return res.status(400).json({
                success: false,
                message: "Nationality is required"
            });
        }

        // =========================================
        // FIND OTP RECORD
        // =========================================

        let record;

        if (emailValue) {

            record = await Otp.findOne({
                email: emailValue,
                otp: otpValue,
                purpose: normalizedPurpose,
                expiresAt: { $gt: new Date() }
            });

        } else if (mobileValue) {

            record = await Otp.findOne({
                mobile: mobileValue,
                otp: otpValue,
                purpose: normalizedPurpose,
                expiresAt: { $gt: new Date() }
            });
        }

        if (!record) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Device metadata stored with the OTP request (and optionally overridden by current payload)
        const storedDeviceMeta = extractDeviceMetadata(record);
        const incomingDeviceMeta = extractDeviceMetadata(req.body);
        const deviceMeta = mergeDeviceMetadata(storedDeviceMeta, incomingDeviceMeta);

        // single use otp
        await Otp.deleteOne({ _id: record._id });


        // =========================================
        // CHANGE MOBILE FLOW
        // =========================================

        if (normalizedPurpose === "change-mobile") {

            user = await AppUser.findById(record.userId)
                .select("+pendingMobile +pendingFullName");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            if (!user.pendingMobile) {
                return res.status(400).json({
                    success: false,
                    message: "No pending profile update found"
                });
            }

            const taken = await AppUser.findOne({
                mobile: user.pendingMobile,
                _id: { $ne: user._id }
            });

            if (taken) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number already in use"
                });
            }

            user.mobile = user.pendingMobile;

            if (user.pendingFullName) {
                user.fullName = user.pendingFullName;
            }

            // clear temp fields
            user.pendingMobile = null;
            user.pendingFullName = null;

            applyDeviceMetadataToUser(user, deviceMeta);
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    mobile: user.mobile
                }
            });
        }


        // =========================================
        // FIND USER FOR OTHER PURPOSES
        // =========================================

        user = await findUserByEmailOrMobile(emailValue, mobileValue);
        if (user) {
            user = await AppUser.findById(user._id).select("+password");
        }

        if (!user && normalizedPurpose !== "register") {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // =========================================
        // REGISTER
        // =========================================

        if (normalizedPurpose === "register") {
            if (user) {
                if (emailValue && user.email === emailValue) {
                    return sendError(res, 409, "Email already exists.");
                }
                if (
                    mobileValue &&
                    smsHelper.getMobileLookupVariants(user.mobile).some((variant) =>
                        smsHelper.getMobileLookupVariants(mobileValue).includes(variant)
                    )
                ) {
                    return sendError(res, 409, "Mobile number already registered.");
                }
                return sendError(res, 409, "Email already exists.");
            }

            if (!password) {
                return res.status(400).json({
                    message: "Password required"
                });
            }

            const hashedPassword =
                await bcrypt.hash(password, 10);

            try {
                user = await AppUser.create({
                    fullName,
                    email: emailValue,
                    mobile: mobileValue,
                    password: hashedPassword,
                    isVerified: true,
                    nationality
                });
            } catch (err) {
                if (err.code === 11000) {
                    const isEmailDuplicate = err.message && err.message.includes("email");
                    if (isEmailDuplicate || Object.keys(err.keyPattern || {}).includes("email")) {
                        return sendError(res, 409, "Email already exists.");
                    }
                    const isMobileDuplicate = err.message && err.message.includes("mobile");
                    if (isMobileDuplicate || Object.keys(err.keyPattern || {}).includes("mobile")) {
                        return sendError(res, 409, "Mobile number already registered.");
                    }
                }
                throw err;
            }
        }


        // =========================================
        // LOGIN
        // =========================================

        if (user && normalizedPurpose === "login") {

            if (emailValue) {

                if (!password) {
                    return res.status(400).json({
                        message: "Password required"
                    });
                }

                const isMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!isMatch) {
                    return res.status(400).json({
                        message: "Invalid password"
                    });
                }
            }
        }


        // =========================================
        // CHANGE PASSWORD
        // =========================================

        if (user && normalizedPurpose === "change-password") {

            const {
                password,
                newPassword,
                confirmPassword
            } = req.body;

            const isMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!isMatch) {
                return res.status(400).json({
                    message: "Current password incorrect"
                });
            }

            if (!newPassword || !confirmPassword) {
                return res.status(400).json({
                    message: "New password and confirm password required"
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    message: "Passwords do not match"
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters"
                });
            }

            user.password = await bcrypt.hash(newPassword, 10);
            user.markModified("password");
        }


        // =========================================
        // FORGOT PASSWORD
        // =========================================

        if (user && normalizedPurpose === "forgot-password") {
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: "Password required"
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }

            user.password = await bcrypt.hash(password, 10);
            user.markModified("password");
        }


        // =========================================
        // TOKENS
        // =========================================

        const token = jwt.sign(
            {
                userId: user._id,
                role: "USER"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h"
            }
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id,
                type: "refresh"
            },
            process.env.REFRESH_SECRET,
            {
                expiresIn: "7d"
            }
        );

        user.refreshToken = refreshToken;
        applyDeviceMetadataToUser(user, deviceMeta);
        await user.save();


        return res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobile: user.mobile,
                isVerified: user.isVerified
            }
        });

    } catch (err) {
        return handleControllerError(res, err, "Verify OTP");
    }
};
/* ================= RESEND OTP ================= */
exports.resendOtp = async (req, res) => {
    req.body.force = true;
    return exports.sendOtp(req, res);
};

/* ================= PUBLIC APIs ================= */
exports.register = async (req, res) => {
    try {
        const { fullName, email, mobile, password, nationality } = req.body;

        if (!fullName?.trim()) {
            return sendError(res, 400, "Full name is required");
        }
        if (!email?.trim()) {
            return sendError(res, 400, "Email is required");
        }
        if (!mobile?.trim()) {
            return sendError(res, 400, "Mobile is required");
        }
        if (!password) {
            return sendError(res, 400, "Password is required");
        }
        if (!nationality) {
            return sendError(res, 400, "Nationality is required");
        }
        if (!mongoose.Types.ObjectId.isValid(nationality)) {
            return sendError(res, 400, "Invalid nationality");
        }

        const country = await AppCountry.findById(nationality);
        if (!country) {
            return sendError(res, 400, "Invalid nationality");
        }

        req.body.purpose = "register";
        return exports.sendOtp(req, res);
    } catch (err) {
        return handleControllerError(res, err, "Register");
    }
};

exports.login = async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        // If login via phone → send OTP
        if (mobile) {
            req.body.purpose = "login";
            return exports.sendOtp(req, res);
        }

        // If login via email → verify password
        if (email && password) {
            const user = await AppUser.findOne({ email }).select("+password");;

            if (!user)
                return res.status(404).json({ message: "User not found" });


            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({ message: "Invalid credentials" });

            const deviceMeta = extractDeviceMetadata(req.body);
            applyDeviceMetadataToUser(user, deviceMeta);

            const token = jwt.sign(
                { userId: user._id, role: "USER" },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );
            const refreshToken = jwt.sign(
                { userId: user._id, type: "refresh" },
                process.env.REFRESH_SECRET,
                { expiresIn: "7d" }
            );

            // Save refresh token in DB
            user.refreshToken = refreshToken;
            await user.save();

            return res.json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    mobile: user.mobile,
                    isVerified: user.isVerified
                }
            });
        }

        return res.status(400).json({ message: "Invalid login request" });

    } catch (err) {
        console.log(err);
        if (err?.isValidationError) {
            return res.status(400).json({ message: err.message });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email, mobile } = req.body;

        if (!email?.trim() && !mobile?.trim()) {
            return sendError(res, 400, "Email or mobile is required");
        }

        req.body.purpose = "forgot-password";
        return exports.sendOtp(req, res);
    } catch (err) {
        return handleControllerError(res, err, "Forgot Password");
    }
};

exports.logout = async (req, res) => {
    try {

        const userId = req.user._id;

        const user = await AppUser.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // remove refresh token
        user.refreshToken = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const {
            currentPassword,
            password,
            oldPassword,
            newPassword,
            confirmPassword,
            email,
            mobile,
        } = req.body;

        const currentPwd = currentPassword || password || oldPassword;

        if (!currentPwd || !newPassword || !confirmPassword) {
            return sendError(
                res,
                400,
                "currentPassword, newPassword, and confirmPassword are required"
            );
        }

        if (newPassword !== confirmPassword) {
            return sendError(res, 400, "New password and confirm password do not match");
        }

        if (String(newPassword).length < 6) {
            return sendError(res, 400, "Password must be at least 6 characters");
        }

        if (currentPwd === newPassword) {
            return sendError(
                res,
                400,
                "New password must be different from the current password"
            );
        }

        let user = req.user;

        if (!user && req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    user = await AppUser.findById(decoded.userId);
                }
            } catch (tokenError) {
                console.warn("Change Password token ignored:", tokenError.message);
            }
        }

        if (!user) {
            const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
            const normalizedMobile = mobile
                ? smsHelper.normalizePhoneForTwilio(mobile)
                : undefined;

            if (!normalizedEmail && !normalizedMobile) {
                return sendError(res, 400, "Email or mobile is required");
            }

            user = await findUserByEmailOrMobile(normalizedEmail, normalizedMobile);
        }

        if (!user) {
            return sendError(res, 404, "User not found");
        }

        user = await AppUser.findById(user._id).select("+password +refreshToken");
        if (!user || user.isDeleted) {
            return sendError(res, 404, "User not found");
        }

        const isMatch = await bcrypt.compare(currentPwd, user.password);
        if (!isMatch) {
            return sendError(res, 400, "Current password incorrect");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const token = jwt.sign(
            { userId: user._id, role: "USER" },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        const refreshToken = jwt.sign(
            { userId: user._id, type: "refresh" },
            process.env.REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // Persist via $set so the password field is always written to MongoDB
        // (avoids document-state / select:false edge cases with save()).
        const updated = await AppUser.findByIdAndUpdate(
            user._id,
            { $set: { password: hashedPassword, refreshToken } },
            { new: true }
        );

        if (!updated) {
            return sendError(res, 404, "User not found");
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
            token,
            refreshToken,
            user: {
                id: updated._id,
                fullName: updated.fullName,
                email: updated.email,
                mobile: updated.mobile,
                isVerified: updated.isVerified,
            },
        });
    } catch (err) {
        return handleControllerError(res, err, "Change Password");
    }
};

exports.getRefreshToken = async (req, res) => {
    try {
        const userId = req.user._id; // From auth middleware

        const user = await AppUser.findById(userId)
            .select("refreshToken email fullName");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Refresh token fetched successfully",
            data: {
                userId: user._id,
                email: user.email,
                refreshToken: user.refreshToken
            }
        });

    } catch (error) {
        console.error("Get Refresh Token Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
