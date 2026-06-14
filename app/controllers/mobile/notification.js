const UserNotification = require("../../models/mobile/userNotification");

const MAX_LIMIT = 50;

const sendSuccess = (res, statusCode, message, data) =>
    res.status(statusCode).json({
        success: true,
        ...(message ? { message } : {}),
        data,
    });

const sendError = (res, statusCode, message) =>
    res.status(statusCode).json({
        success: false,
        message,
    });

const parsePagination = (query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 20));

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

const getActiveNotificationQuery = (userId) => ({
    userId,
    isDeleted: { $ne: true },
});

const LIST_PROJECTION =
    "title message type readAt createdAt updatedAt campaignId metadata";

const applyReadFilter = (query, queryParams) => {
    const { filter, status, read, unreadOnly } = queryParams;
    const readFilter = String(filter || status || "").trim().toLowerCase();

    if (readFilter) {
        if (readFilter === "read") {
            query.readAt = { $ne: null };
            return;
        }
        if (readFilter === "unread") {
            query.readAt = null;
            return;
        }
        if (readFilter !== "all") {
            const error = new Error('Invalid notification filter. Use "all", "read", or "unread".');
            error.statusCode = 400;
            throw error;
        }
    }

    if (read !== undefined && read !== "") {
        if (read === "true") {
            query.readAt = { $ne: null };
            return;
        }
        if (read === "false") {
            query.readAt = null;
            return;
        }
        const error = new Error('Invalid read filter. Use "true" or "false".');
        error.statusCode = 400;
        throw error;
    }

    if (unreadOnly === "true") {
        query.readAt = null;
    }
};

const mapNotification = (notification) => ({
    ...notification,
    isRead: Boolean(notification.readAt),
    color: notification.metadata?.color || null,
    action: notification.metadata?.action || null,
});

exports.getNotifications = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const query = getActiveNotificationQuery(req.user._id);
        applyReadFilter(query, req.query);

        const baseQuery = getActiveNotificationQuery(req.user._id);

        const [list, total, unreadCount] = await Promise.all([
            UserNotification.find(query)
                .select(LIST_PROJECTION)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            UserNotification.countDocuments(query),
            UserNotification.countDocuments({
                ...baseQuery,
                readAt: null,
            }),
        ]);

        return sendSuccess(res, 200, null, {
            list: list.map(mapNotification),
            unreadCount,
            totalCount: total,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 0,
            },
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Server error");
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await UserNotification.findOneAndUpdate(
            {
                _id: req.params.id,
                ...getActiveNotificationQuery(req.user._id),
            },
            { readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }

        return sendSuccess(res, 200, "Notification marked as read", mapNotification(notification.toObject()));
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Server error");
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const now = new Date();
        const result = await UserNotification.updateMany(
            {
                ...getActiveNotificationQuery(req.user._id),
                readAt: null,
            },
            { $set: { readAt: now } }
        );

        return sendSuccess(res, 200, "Notifications marked as read", {
            updatedCount: result.modifiedCount || result.nModified || 0,
            markedAt: now,
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Server error");
    }
};

exports.clearAllNotifications = async (req, res) => {
    try {
        const now = new Date();
        const result = await UserNotification.updateMany(
            getActiveNotificationQuery(req.user._id),
            {
                $set: {
                    isDeleted: true,
                    deletedAt: now,
                },
            }
        );

        return sendSuccess(res, 200, "Notifications cleared successfully", {
            deletedCount: result.modifiedCount || result.nModified || 0,
            clearedAt: now,
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || "Server error");
    }
};
