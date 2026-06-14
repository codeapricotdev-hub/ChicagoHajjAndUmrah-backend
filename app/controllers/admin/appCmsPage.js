const AppCmsPage = require("../../models/mobile/appCmsPage");
const { notifyAllActiveUsers } = require("../../helpers/mobile/userNotificationService");
const { NOTIFICATION_ACTIONS } = require("../../helpers/mobile/notificationTemplates");

const APP_VERSION_CMS_TYPE = "APP_VERSION";

const notifyAppUpdateIfNeeded = (type, value) => {
    if (String(type).trim().toUpperCase() !== APP_VERSION_CMS_TYPE) {
        return;
    }

    notifyAllActiveUsers(NOTIFICATION_ACTIONS.APP_UPDATE_AVAILABLE, {
        version: value != null ? String(value) : "",
    }).catch((error) => {
        console.error("APP_UPDATE notification failed:", error.message);
    });
};

exports.create = async (req, res) => {
    try {
        const { type, value } = req.body;
        if (!type || !String(type).trim()) {
            return res.status(400).json({
                success: false,
                message: "Type is required",
            });
        }
        const exists = await AppCmsPage.findOne({
            type: String(type).trim(),
        }).lean();
        if (exists) {
            return res.status(400).json({
                success: false,
                message: "A CMS entry with this type already exists",
            });
        }
        const doc = await AppCmsPage.create({
            type: String(type).trim(),
            value: value != null ? String(value) : "",
        });
        notifyAppUpdateIfNeeded(doc.type, doc.value);
        return res.status(201).json({
            success: true,
            data: doc,
            message: "CMS page created successfully",
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "A CMS entry with this type already exists",
            });
        }
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    }
};

exports.list = async (req, res) => {
    try {
        const { filter } = req.query;
        const query = {};
        if (filter) {
            query.type = { $regex: filter, $options: "i" };
        }
        const rows = await AppCmsPage.find(query).sort({ type: 1 }).lean();
        return res.json({
            success: true,
            data: rows,
            message: "CMS pages loaded",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const doc = await AppCmsPage.findById(req.params.id).lean();
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "CMS page not found",
            });
        }
        return res.json({
            success: true,
            data: doc,
            message: "CMS page found",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { type, value } = req.body;
        const doc = await AppCmsPage.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "CMS page not found",
            });
        }
        if (type != null && String(type).trim()) {
            const nextType = String(type).trim();
            if (nextType !== doc.type) {
                const clash = await AppCmsPage.findOne({ type: nextType });
                if (clash) {
                    return res.status(400).json({
                        success: false,
                        message: "Another CMS entry already uses this type",
                    });
                }
                doc.type = nextType;
            }
        }
        if (value !== undefined) {
            doc.value = value != null ? String(value) : "";
        }
        await doc.save();
        notifyAppUpdateIfNeeded(doc.type, doc.value);
        return res.json({
            success: true,
            data: doc,
            message: "CMS page updated successfully",
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "A CMS entry with this type already exists",
            });
        }
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    }
};

exports.remove = async (req, res) => {
    try {
        const doc = await AppCmsPage.findByIdAndDelete(req.params.id);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "CMS page not found",
            });
        }
        return res.json({
            success: true,
            message: "CMS page deleted successfully",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    }
};
