const mongoose = require("mongoose");
const models = require("../../models").default;
const db = require("../../middleware/db");
const UserNotification = require("../../models/mobile/userNotification");
const { sendPushNotificationToUser } = require("../../helpers/mobile/pushNotification");

/**
 * Get all mobile inquiries (umrahInquiry)
 */
exports.getAllMobileInquiries = async (req, res) => {
    try {
        const { search, page, limit, status, sort = "createdAt", order = -1 } = req.query;

        // Base query to fetch only mobile inquiries (type: umrahInquiry)
        const query = {
            type: "umrahInquiry",
        };

        if (status) {
            query.status = status;
        }

        if (search) {
            const searchVal = String(search).trim();
            query.$or = [
                { refId: { $regex: searchVal, $options: "i" } },
                { fullName: { $regex: searchVal, $options: "i" } },
                { email: { $regex: searchVal, $options: "i" } },
                { mobileNumber: { $regex: searchVal, $options: "i" } },
                { country: { $regex: searchVal, $options: "i" } },
                { message: { $regex: searchVal, $options: "i" } },
            ];
        }

        const getAllRecord = await db.getData({
            req: {
                page: parseInt(page, 10) || 1,
                limit: parseInt(limit, 10) || 10,
                sort: sort,
                order: parseInt(order, 10) || -1,
                lean: true,
                populate: [
                    {
                        path: "userId",
                        select: "_id email fullName mobile status isVerified",
                    },
                ],
            },
            model: models.Inquiry,
            query: query,
        });

        return res.status(200).json({
            status: 200,
            success: true,
            data: getAllRecord,
            message: "Inquiries retrieved successfully.",
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};

/**
 * Get single mobile inquiry detail by ID
 */
exports.getMobileInquiryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Invalid Inquiry ID.",
            });
        }

        const inquiry = await models.Inquiry.findById(id)
            .populate({
                path: "userId",
                select: "_id email fullName mobile status isVerified nationality",
            })
            .populate({
                path: "repliedBy",
                select: "_id email fullName",
            })
            .lean();

        if (!inquiry || inquiry.type !== "umrahInquiry") {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Inquiry not found.",
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            data: inquiry,
            message: "Inquiry details retrieved successfully.",
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};

/**
 * Reply to mobile inquiry, trigger FCM push, and insert DB UserNotification
 */
exports.replyToMobileInquiry = async (req, res) => {
    try {
        const { inquiryId, replyMessage } = req.body;

        if (!inquiryId) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Inquiry ID is required.",
            });
        }

        if (!replyMessage || String(replyMessage).trim() === "") {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Reply message is mandatory and cannot be empty.",
            });
        }

        const inquiry = await models.Inquiry.findById(inquiryId);

        if (!inquiry || inquiry.type !== "umrahInquiry") {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Inquiry not found.",
            });
        }

        // Update inquiry
        inquiry.replyMessage = replyMessage.trim();
        inquiry.repliedBy = req.user._id;
        inquiry.replyDate = new Date();
        inquiry.status = "Replied";
        await inquiry.save();

        let pushStatus = { skipped: true, reason: "No user attached to inquiry" };

        // Handle notifications if userId exists
        if (inquiry.userId) {
            const title = "Inquiry Reply";
            const body = "Your inquiry has been replied to. Please check the application for more details.";

            // 1. Send push notification first as requested
            try {
                pushStatus = await sendPushNotificationToUser(inquiry.userId, {
                    title,
                    message: body,
                    data: {
                        inquiryId: inquiry._id.toString(),
                        type: "INQUIRY_REPLY",
                    },
                });
            } catch (pushErr) {
                console.error("FCM dispatch failed during inquiry reply:", pushErr);
                pushStatus = { success: false, error: pushErr.message };
            }

            // 2. Insert DB UserNotification immediately after FCM trigger
            try {
                await UserNotification.create({
                    userId: inquiry.userId,
                    title,
                    message: body,
                    type: "SYSTEM",
                    metadata: {
                        inquiryId: inquiry._id,
                        action: "INQUIRY_REPLY",
                    },
                });
            } catch (dbNotifyErr) {
                console.error("Failed to insert UserNotification into database:", dbNotifyErr);
            }
        }

        return res.status(200).json({
            success: true,
            status: 200,
            data: {
                inquiry,
                push: pushStatus,
            },
            message: "Reply sent and saved successfully.",
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};
