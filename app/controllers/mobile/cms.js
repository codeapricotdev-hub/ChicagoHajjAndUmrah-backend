const AppCmsPage = require("../../models/mobile/appCmsPage");

exports.list = async (req, res) => {
    try {
        const rows = await AppCmsPage.find({})
            .select("type value updatedAt")
            .sort({ type: 1 })
            .lean();
        return res.json({
            success: true,
            data: rows,
            message: "CMS content loaded",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    }
};

exports.getByType = async (req, res) => {
    try {
        const { type } = req.body;
        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Type is required",
            });
        }
        const doc = await AppCmsPage.findOne({ type: type }).lean();
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "CMS content not found",
            });
        }
        return res.json({
            success: true,
            data: doc,
            message: "CMS content found",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error",
        });
    }
};
