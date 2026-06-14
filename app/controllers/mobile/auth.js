const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AppUser = require("../../models/appUser");
const Otp = require("../../models/mobile/otp");
const smtp = require("../../helpers/mail");
const { sendOtpSms } = require("../../helpers/sms");

const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const DEVICE_OS_TYPES = ["android", "ios"];
const LAST_DELIVERY_STATUSES = ["success", "failed", "pending"];

const validationError = (message) => {
    const err = new Error(message);
    err.isValidationError = true;
    return err;
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
    // Guide fields (mobile may also send legacy `fcmToken`)
    const tokenValue = source.deviceToken ?? source.fcmToken;

    return {
        deviceToken: normalizeOptionalString(tokenValue, "deviceToken"),
        osType: normalizeOptionalEnum(source.osType, DEVICE_OS_TYPES, "osType"),
        osVersion: normalizeOptionalString(source.osVersion, "osVersion"),
        deviceManufacturer: normalizeOptionalString(
            source.deviceManufacturer,
            "deviceManufacturer"
        ),
        notificationsEnabled: normalizeOptionalBoolean(
            source.notificationsEnabled,
            "notificationsEnabled"
        ),
        firebaseSdkVersion: normalizeOptionalString(
            source.firebaseSdkVersion,
            "firebaseSdkVersion"
        ),
        lastDeliveryStatus: normalizeOptionalEnum(
            source.lastDeliveryStatus,
            LAST_DELIVERY_STATUSES,
            "lastDeliveryStatus"
        ),
    };
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

/* ================= SEND OTP (CORE) ================= */
exports.sendOtp = async (req, res) => {
    try {
        const { fullName, email, mobile, purpose } = req.body;

        if (!email && !mobile)
            return res.status(400).json({ message: "Email or mobile required" });

        if (purpose === "register" && !fullName)
            return res.status(400).json({ message: "Full name required" });

        const allowedPurposes = ["register", "login", "forgot-password", "change-password"];
        if (!allowedPurposes.includes(purpose))
            return res.status(400).json({ message: "Invalid purpose" });

        if (purpose !== "register") {
            const user = await AppUser.findOne({
                $or: [
                    email ? { email } : null,
                    mobile ? { mobile } : null
                ].filter(Boolean)
            });

            if (!user)
                return res.status(404).json({ message: "User not found" });
        }

        // Delete old OTPs
        const filter = { purpose };
        if (email) filter.email = email;
        if (mobile) filter.mobile = mobile;

        await Otp.deleteMany(filter);

        const otp = generateOtp().toString();

        const deviceMeta = extractDeviceMetadata(req.body);

        await Otp.create({
            email,
            mobile,
            otp,
            purpose,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            ...pickDefined(deviceMeta),
        });

        // Send Email / SMS here
        // if (email) await smtp.sendMailSendGrid(...)
        // if (mobile) await sendOtpSms(mobile, otp);

        return res.json({
            success: true,
            otp: otp,
            message: "OTP sent successfully"
        });

    } catch (err) {
        console.error("Send OTP Error:", err);
        if (err?.isValidationError) {
            return res.status(400).json({ message: err.message });
        }
        return res.status(500).json({ message: "Internal server error" });
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

        const emailValue = email?.trim() || undefined;
        const mobileValue = mobile?.trim() || undefined;
        const otpValue = otp?.toString();

        if (purpose === "register" && !nationality) {
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
                purpose,
                expiresAt: { $gt: new Date() }
            });

        } else if (mobileValue) {

            record = await Otp.findOne({
                mobile: mobileValue,
                otp: otpValue,
                purpose,
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

        if (purpose === "change-mobile") {

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

        user = await AppUser.findOne({
            $or: [
                email ? { email } : null,
                mobile ? { mobile } : null
            ].filter(Boolean)
        }).select("+password");


        // =========================================
        // REGISTER
        // =========================================

        if (!user && purpose === "register") {

            if (!password) {
                return res.status(400).json({
                    message: "Password required"
                });
            }

            const hashedPassword =
                await bcrypt.hash(password, 10);

            user = await AppUser.create({
                fullName,
                email,
                mobile,
                password: hashedPassword,
                isVerified: true,
                nationality
            });
        }


        // =========================================
        // LOGIN
        // =========================================

        if (user && purpose === "login") {

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

        if (user && purpose === "change-password") {

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

            user.password =
                await bcrypt.hash(newPassword, 10);
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

        console.error(err);

        if (err?.isValidationError) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
/* ================= RESEND OTP ================= */
exports.resendOtp = async (req, res) => {
    req.body.force = true;
    return exports.sendOtp(req, res);
};

/* ================= PUBLIC APIs ================= */
exports.register = (req, res) => {
    req.body.purpose = "register";
    return exports.sendOtp(req, res);
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

exports.forgotPassword = (req, res) => {
    req.body.purpose = "forgot-password";
    return exports.sendOtp(req, res);
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

exports.changePassword = (req, res) => {
    req.body.purpose = "change-password";
    return exports.sendOtp(req, res);
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
