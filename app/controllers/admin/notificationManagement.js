const mongoose = require("mongoose");
const validator = require("validator");
const AppUser = require("../../models/appUser");
const Application = require("../../models/mobile/application");
const NotificationCampaign = require("../../models/mobile/notificationCampaign");
const UserNotification = require("../../models/mobile/userNotification");
const {
    sendPushNotificationToUsers,
} = require("../../helpers/mobile/pushNotification");
const { NOTIFICATION_ACTIONS } = require("../../helpers/mobile/notificationTemplates");

const VISA_TYPES = ["UMRAH", "1_YEAR", "5_YEAR", "10_YEAR"];
const USER_STATUSES = ["active", "inactive"];

const toArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

const cleanStringArray = (value) =>
    toArray(value)
        .map((item) => String(item || "").trim())
        .filter(Boolean);

const sanitizeFilters = (filters = {}) => ({
    visaTypes: cleanStringArray(filters.visaTypes),
    statuses: cleanStringArray(filters.statuses),
    search: String(filters.search || "").trim() || null,
    names: cleanStringArray(filters.names),
    emails: cleanStringArray(filters.emails).map((email) => email.toLowerCase()),
    userIds: cleanStringArray(filters.userIds),
    isVerified:
        filters.isVerified === true || filters.isVerified === false
            ? filters.isVerified
            : null,
});

const buildRecipientQuery = async (filters = {}) => {
    const query = { isDeleted: { $ne: true } };
    const and = [];
    const search = String(filters.search || "").trim();

    if (search) {
        and.push({
            $or: [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
            ],
        });
    }

    const names = cleanStringArray(filters.names);
    if (names.length) {
        and.push({
            $or: names.map((name) => ({
                fullName: { $regex: name, $options: "i" },
            })),
        });
    }

    const emails = cleanStringArray(filters.emails).map((email) => email.toLowerCase());
    const invalidEmail = emails.find((email) => !validator.isEmail(email));
    if (invalidEmail) {
        const error = new Error(`Invalid email: ${invalidEmail}`);
        error.statusCode = 400;
        throw error;
    }
    if (emails.length) query.email = { $in: emails };

    const userIds = cleanStringArray(filters.userIds);
    if (userIds.length) {
        const invalidUserId = userIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
        if (invalidUserId) {
            const error = new Error("Invalid user id in selected users");
            error.statusCode = 400;
            throw error;
        }
        query._id = { $in: userIds };
    }

    const statuses = cleanStringArray(filters.statuses);
    if (statuses.length) {
        const invalidStatus = statuses.find((status) => !USER_STATUSES.includes(status));
        if (invalidStatus) {
            const error = new Error("Invalid user status filter");
            error.statusCode = 400;
            throw error;
        }
        query.status = { $in: statuses };
    }

    if (filters.isVerified === true || filters.isVerified === false) {
        query.isVerified = filters.isVerified;
    }

    const visaTypes = cleanStringArray(filters.visaTypes);
    if (visaTypes.length) {
        const invalidVisaType = visaTypes.find((visaType) => !VISA_TYPES.includes(visaType));
        if (invalidVisaType) {
            const error = new Error("Invalid visa type filter");
            error.statusCode = 400;
            throw error;
        }

        const usersWithVisa = await Application.distinct("userId", {
            visaType: { $in: visaTypes },
        });
        and.push({ _id: { $in: usersWithVisa } });
    }

    if (and.length) query.$and = and;
    return query;
};

exports.previewRecipients = async (req, res) => {
    try {
        const query = await buildRecipientQuery(req.body.filters || req.query || {});
        const [users, total] = await Promise.all([
            AppUser.find(query)
                .select("fullName email mobile status isVerified")
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
            AppUser.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            data: { total, preview: users },
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.sendNotification = async (req, res) => {
    try {
        const title = String(req.body.title || "").trim();
        const message = String(req.body.message || "").trim();
        const filters = sanitizeFilters(req.body.filters || {});
        const announcementType = String(req.body.announcementType || "").trim().toUpperCase();
        const isImportantUpdate = announcementType === NOTIFICATION_ACTIONS.IMPORTANT_UPDATE;

        if (title.length > 120) {
            return res.status(400).json({ success: false, message: "Title must be 120 characters or less" });
        }
        if (message.length < 5) {
            return res.status(400).json({ success: false, message: "Message is required (min 5 chars)" });
        }
        if (message.length > 1000) {
            return res.status(400).json({ success: false, message: "Message must be 1000 characters or less" });
        }

        const query = await buildRecipientQuery(filters);
        const recipients = await AppUser.find(query)
            .select("_id fcmToken fcmTokens deviceToken deviceTokens")
            .lean();
        if (!recipients.length) {
            return res.status(400).json({ success: false, message: "No users matched the selected filters" });
        }

        const campaign = await NotificationCampaign.create({
            title: title || null,
            message,
            filters,
            totalRecipients: recipients.length,
            sentByAdminId: req.user._id,
        });

        const notifications = await UserNotification.insertMany(
            recipients.map((recipient) => ({
                campaignId: campaign._id,
                userId: recipient._id,
                title: title || null,
                message,
                type: isImportantUpdate ? "SYSTEM" : "ADMIN_BROADCAST",
                metadata: {
                    filters,
                    ...(isImportantUpdate
                        ? {
                              action: NOTIFICATION_ACTIONS.IMPORTANT_UPDATE,
                              color: "BLUE",
                          }
                        : {}),
                },
            })),
            { ordered: false }
        );

        const pushSummary = await sendPushNotificationToUsers(recipients, {
            title: title || "Notification",
            message,
            data: {
                campaignId: campaign._id,
                type: isImportantUpdate
                    ? NOTIFICATION_ACTIONS.IMPORTANT_UPDATE
                    : "ADMIN_BROADCAST",
                ...(isImportantUpdate ? { color: "BLUE" } : {}),
            },
        });

        return res.status(201).json({
            success: true,
            message: "Notification sent successfully",
            data: {
                campaign,
                totalRecipients: recipients.length,
                totalNotifications: notifications.length,
                push: pushSummary,
            },
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.getCampaigns = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
        const [list, total] = await Promise.all([
            NotificationCampaign.find()
                .populate("sentByAdminId", "fullName email")
                .sort({ createdAt: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .lean(),
            NotificationCampaign.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                list,
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
