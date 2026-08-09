const AppUser = require("../../models/appUser");
const admin = require("../../../config/firebase");

const getUserTokens = (user) => {
    const rawTokens = []
        .concat(user?.fcmTokens || [])
        .concat(user?.deviceTokens || [])
        .concat(user?.fcmToken || [])
        .concat(user?.deviceToken || []);

    return [...new Set(rawTokens.map((token) => String(token || "").trim()).filter(Boolean))];
};

const normalizeData = (data = {}) =>
    Object.keys(data).reduce((result, key) => {
        result[key] = String(data[key] ?? "");
        return result;
    }, {});

const buildMulticastPayload = ({ title, message, data, tokens }) => ({
    notification: {
        title,
        body: message,
    },
    data: normalizeData(data),
    tokens,
});

const handleInvalidTokens = async (tokens, responses) => {
    const invalidTokens = [];
    responses.forEach((resp, idx) => {
        if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
                errorCode === "messaging/invalid-registration-token" ||
                errorCode === "messaging/registration-token-not-registered"
            ) {
                invalidTokens.push(tokens[idx]);
            }
        }
    });

    if (invalidTokens.length > 0) {
        try {
            await AppUser.updateMany(
                {
                    $or: [
                        { fcmTokens: { $in: invalidTokens } },
                        { deviceTokens: { $in: invalidTokens } },
                    ],
                },
                {
                    $pull: {
                        fcmTokens: { $in: invalidTokens },
                        deviceTokens: { $in: invalidTokens },
                    },
                }
            );

            await AppUser.updateMany(
                { fcmToken: { $in: invalidTokens } },
                { $set: { fcmToken: null } }
            );

            await AppUser.updateMany(
                { deviceToken: { $in: invalidTokens } },
                { $set: { deviceToken: null } }
            );
        } catch (dbError) {
            console.error("Error cleaning up invalid FCM tokens:", dbError);
        }
    }
};

exports.sendPushNotificationToUser = async (
    userId,
    { title, message, data = {} }
) => {
    const user = await AppUser.findById(userId)
        .select("fcmTokens fcmToken deviceToken deviceTokens")
        .lean();

    const tokens = getUserTokens(user);

    if (!tokens.length) {
        return {
            skipped: true,
            reason: "No push token registered for user",
        };
    }

    const payload = buildMulticastPayload({ title, message, data, tokens });

    try {
        const response = await admin.messaging().sendEachForMulticast(payload);

        if (response.failureCount > 0) {
            await handleInvalidTokens(tokens, response.responses);
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
        };
    } catch (error) {
        console.error("FCM Error:", error);

        return {
            success: false,
            error: error.message,
        };
    }
};

exports.sendPushNotificationToUsers = async (users = [], { title, message, data = {} }) => {
    const tokens = [
        ...new Set(users.flatMap((user) => getUserTokens(user))),
    ];

    if (!tokens.length) {
        return {
            skipped: true,
            reason: "No push tokens registered for recipients",
            totalTokens: 0,
            successCount: 0,
            failureCount: 0,
        };
    }

    const chunks = [];
    for (let index = 0; index < tokens.length; index += 500) {
        chunks.push(tokens.slice(index, index + 500));
    }

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const chunk of chunks) {
        try {
            const response = await admin.messaging().sendEachForMulticast(
                buildMulticastPayload({ title, message, data, tokens: chunk })
            );
            successCount += response.successCount;
            failureCount += response.failureCount;

            if (response.failureCount > 0) {
                await handleInvalidTokens(chunk, response.responses);
            }
        } catch (error) {
            console.error("FCM Error:", error);
            failureCount += chunk.length;
            errors.push(error.message);
        }
    }

    return {
        skipped: false,
        totalTokens: tokens.length,
        successCount,
        failureCount,
        batches: chunks.length,
        ...(errors.length ? { errors } : {}),
    };
};
