const mongoose = require("mongoose");
const validator = require("validator");
const AppUser = require("../../models/appUser");
const Application = require("../../models/mobile/application");
const Payment = require("../../models/mobile/payment");

const USER_STATUSES = ["active", "inactive"];

const buildUserQuery = ({ search, status, isVerified, nationality }) => {
    const query = { isDeleted: { $ne: true } };

    if (status && USER_STATUSES.includes(status)) {
        query.status = status;
    }

    if (isVerified === "true" || isVerified === "false") {
        query.isVerified = isVerified === "true";
    }

    if (nationality && mongoose.Types.ObjectId.isValid(nationality)) {
        query.nationality = nationality;
    }

    if (search) {
        const value = String(search).trim();
        query.$or = [
            { fullName: { $regex: value, $options: "i" } },
            { email: { $regex: value, $options: "i" } },
            { mobile: { $regex: value, $options: "i" } },
        ];
    }

    return query;
};

const sanitizeUser = (user) => {
    const data = typeof user?.toObject === "function" ? user.toObject() : user;
    if (!data) return null;

    delete data.password;
    delete data.refreshToken;
    return data;
};

exports.getAppUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, isVerified, nationality } = req.query;
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
        const query = buildUserQuery({ search, status, isVerified, nationality });

        const [users, total] = await Promise.all([
            AppUser.find(query)
                .select("-password -refreshToken")
                .populate("nationality", "countryName status")
                .sort({ createdAt: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .lean(),
            AppUser.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                list: users,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    totalPages: Math.ceil(total / safeLimit),
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.getAppUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id",
            });
        }

        const user = await AppUser.findOne({ _id: id, isDeleted: { $ne: true } })
            .select("-password -refreshToken")
            .populate("nationality", "countryName status");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const [applicationCount, latestApplications, payments] = await Promise.all([
            Application.countDocuments({ userId: id }),
            Application.find({ userId: id })
                .select("applicationIdentifier visaType status statusChangedAt createdAt")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Payment.find({ userId: id })
                .select("applicationId transactionId paymentMode amount currency status referenceNumber stripeSessionId stripePaymentIntentId createdAt updatedAt")
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                user: sanitizeUser(user),
                stats: {
                    applicationCount,
                    paymentCount: payments.length,
                },
                latestApplications,
                payments,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.updateAppUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, mobile, nationality, status, isVerified } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id",
            });
        }

        const user = await AppUser.findOne({ _id: id, isDeleted: { $ne: true } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (fullName !== undefined) {
            const nextName = String(fullName).trim();
            if (!nextName) {
                return res.status(400).json({
                    success: false,
                    message: "Full name is required",
                });
            }
            user.fullName = nextName;
        }

        if (email !== undefined) {
            const nextEmail = String(email).trim().toLowerCase();
            if (nextEmail && !validator.isEmail(nextEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email",
                });
            }
            user.email = nextEmail || undefined;
        }

        if (mobile !== undefined) {
            const nextMobile = String(mobile).trim();
            if (!nextMobile) {
                return res.status(400).json({
                    success: false,
                    message: "Mobile number is required",
                });
            }
            user.mobile = nextMobile;
            user.pendingMobile = null;
            user.pendingFullName = null;
        }

        if (nationality !== undefined) {
            if (!nationality) {
                user.nationality = undefined;
            } else if (!mongoose.Types.ObjectId.isValid(nationality)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid nationality",
                });
            } else {
                user.nationality = nationality;
            }
        }

        if (status !== undefined) {
            if (!USER_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user status",
                });
            }
            user.status = status;
        }

        if (isVerified !== undefined) {
            user.isVerified = Boolean(isVerified);
        }

        await user.save();

        const fresh = await AppUser.findById(user._id)
            .select("-password -refreshToken")
            .populate("nationality", "countryName status");

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: sanitizeUser(fresh),
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or mobile already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
