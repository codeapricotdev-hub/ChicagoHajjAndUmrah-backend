const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/appUser");
const { sendOtpSms } = require("../../helpers/sms");
const Otp = require("../../models/mobile/otp");
const { uploadToS3 } = require("../../helpers/mobile/s3");
const mongoose = require("mongoose");
const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .select("fullName email mobile nationality createdAt profilePic")
            .populate("nationality", "countryName");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: {
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.mobile,
                nationality: user.nationality?.countryName || null,
                profilePic: user.profilePic || null,
                memberSince: user.createdAt
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// exports.editProfile = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         let { fullName, phoneNumber } = req.body;

//         const hasNameChange =
//             fullName !== undefined &&
//             fullName !== null;

//         const hasPhoneChangeInput =
//             phoneNumber !== undefined &&
//             phoneNumber !== null;

//         if (!hasNameChange && !hasPhoneChangeInput) {
//             return res.status(400).json({
//                 success: false,
//                 message: "No changes provided"
//             });
//         }

//         const user = await User.findById(userId)
//             .select("+pendingMobile +pendingFullName");

//         if (!user || user.isDeleted) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         let newName = user.fullName;

//         if (hasNameChange) {

//             fullName = String(fullName).trim();

//             if (!fullName) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Full name cannot be empty"
//                 });
//             }

//             newName = fullName;
//         }

//         let incomingMobile = user.mobile;

//         if (hasPhoneChangeInput) {

//             incomingMobile = String(phoneNumber).trim();

//             if (!incomingMobile) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Phone number cannot be empty"
//                 });
//             }
//         }

//         const mobileChanged =
//             hasPhoneChangeInput &&
//             incomingMobile !== user.mobile;


//         // ==============================
//         // PHONE CHANGED -> OTP FLOW
//         // ==============================

//         if (mobileChanged) {

//             const taken = await User.findOne({
//                 mobile: incomingMobile,
//                 _id: { $ne: userId }
//             });

//             if (taken) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "This phone number is already in use"
//                 });
//             }

//             await Otp.deleteMany({
//                 mobile: incomingMobile,
//                 purpose: "change-mobile"
//             });

//             const otp = generateOtp().toString();

//             await Otp.create({
//                 mobile: incomingMobile,
//                 otp,
//                 purpose: "change-mobile",
//                 userId,
//                 expiresAt: new Date(Date.now() + 5 * 60 * 1000)
//             });

//             // Store pending changes
//             user.pendingMobile = incomingMobile;
//             user.pendingFullName = newName;

//             await user.save();

//             // sendOtpSms(incomingMobile, otp);

//             return res.status(200).json({
//                 success: true,
//                 requiresOtpVerification: true,
//                 otp, // remove in production
//                 message:
//                     "OTP sent to new mobile. Verify OTP to complete update."
//             });
//         }


//         // ==============================
//         // ONLY NAME CHANGED
//         // ==============================

//         if (hasNameChange) {
//             user.fullName = newName;
//             await user.save();
//         }

//         const fresh = await User.findById(userId)
//             .select("fullName email mobile nationality createdAt")
//             .populate("nationality", "countryName");

//         return res.status(200).json({
//             success: true,
//             message: "Profile updated successfully",
//             data: {
//                 fullName: fresh.fullName,
//                 email: fresh.email,
//                 phoneNumber: fresh.mobile,
//                 nationality: fresh.nationality?.countryName || null,
//                 memberSince: fresh.createdAt
//             }
//         });

//     } catch (error) {

//         if (error.code === 11000) {
//             return res.status(400).json({
//                 success: false,
//                 message: "This phone number is already in use"
//             });
//         }

//         console.error(error);

//         return res.status(500).json({
//             success: false,
//             message: "Server error"
//         });
//     }
// };

exports.editProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        let { fullName, phoneNumber, nationality } = req.body;
        const file = req.file;

        const hasNameChange = fullName !== undefined && fullName !== null;
        const hasPhoneChangeInput = phoneNumber !== undefined && phoneNumber !== null;
        const hasNationalityChange = nationality !== undefined && nationality !== null;
        const hasProfilePicChange = !!file;

        if (!hasNameChange && !hasPhoneChangeInput && !hasNationalityChange && !hasProfilePicChange) {
            return res.status(400).json({
                success: false,
                message: "No changes provided"
            });
        }

        const user = await User.findById(userId)
            .select("+pendingMobile +pendingFullName");

        if (!user || user.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // ======================
        // NAME
        // ======================
        let newName = user.fullName;

        if (hasNameChange) {
            fullName = String(fullName).trim();

            if (!fullName) {
                return res.status(400).json({
                    success: false,
                    message: "Full name cannot be empty"
                });
            }

            newName = fullName;
        }

        // ======================
        // PHONE
        // ======================
        let incomingMobile = user.mobile;

        if (hasPhoneChangeInput) {


            incomingMobile = phoneNumber ? String(phoneNumber).replace(/[^\d+]/g, "") : "";

            if (!incomingMobile) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number cannot be empty"
                });
            }
        }

        const mobileChanged =
            hasPhoneChangeInput &&
            incomingMobile !== user.mobile;

        // ======================
        // PHONE CHANGE → OTP FLOW
        // ======================
        if (mobileChanged) {

            const taken = await User.findOne({
                mobile: incomingMobile,
                _id: { $ne: userId }
            });

            if (taken) {
                return res.status(400).json({
                    success: false,
                    message: "This phone number is already in use"
                });
            }

            await Otp.deleteMany({
                mobile: incomingMobile,
                purpose: "change-mobile"
            });

            const otp = generateOtp().toString();

            await Otp.create({
                mobile: incomingMobile,
                otp,
                purpose: "change-mobile",
                userId,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            });

            user.pendingMobile = incomingMobile;
            user.pendingFullName = newName;

            await user.save();

            return res.status(200).json({
                success: true,
                requiresOtpVerification: true,
                otp, // ❌ remove in production
                message: "OTP sent to new mobile. Verify OTP to complete update."
            });
        }

        // ======================
        // DIRECT UPDATES
        // ======================

        if (hasNameChange) {
            user.fullName = newName;
        }

        if (hasNationalityChange) {
            if (!mongoose.Types.ObjectId.isValid(nationality)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid nationality"
                });
            }

            user.nationality = nationality;
        }

        // ======================
        // PROFILE PIC (S3 LOGIC)
        // ======================
        if (file) {

            // Optional validation
            if (!file.mimetype.startsWith("image/")) {
                return res.status(400).json({
                    success: false,
                    message: "Only image files are allowed"
                });
            }

            const key = user.profilePicKey || `profile/${userId}`;

            const uploadResult = await uploadToS3(file, key);

            user.profilePic = uploadResult.url;
            user.profilePicKey = uploadResult.key;
        }

        await user.save();

        const fresh = await User.findById(userId)
            .select("fullName email mobile nationality profilePic createdAt")
            .populate("nationality", "countryName");

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                fullName: fresh.fullName,
                email: fresh.email,
                phoneNumber: fresh.mobile,
                nationality: fresh.nationality?.countryName || null,
                profilePic: fresh.profilePic,
                memberSince: fresh.createdAt
            }
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "This phone number is already in use"
            });
        }

        console.error("EDIT PROFILE ERROR", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "oldPassword, newPassword, and confirmPassword are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters",
            });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from the old password",
            });
        }

        const user = await User.findById(userId).select("+password +refreshToken");
        if (!user || user.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);

        const token = jwt.sign(
            { userId: user._id, role: "USER" },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.REFRESH_SECRET,
            { expiresIn: "7d" }
        );
        user.refreshToken = refreshToken;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
            token,
            refreshToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                mobile: user.mobile,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {

        const userId = req.user._id; // safer than body

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isDeleted) {
            return res.status(400).json({
                success: false,
                message: "User already deleted"
            });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.saveFcmToken = async (req, res) => {
    try {
        console.log("BODY:", req.body);
        console.log("USER:", req.user);

        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: {
                fcmTokens: fcmToken,
            },
        });

        return res.status(200).json({
            success: true,
            message: "FCM token saved successfully",
        });
    } catch (error) {
        console.error("SAVE FCM TOKEN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};