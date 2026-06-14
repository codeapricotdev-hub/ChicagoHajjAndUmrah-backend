const models = require("../../models").default;
const db = require("../../middleware/db");
const { MAIN_USER, MAIN_ADMIN } = require("../../middleware/constant");

exports.GetAllTransaction = async (req, res) => {
    try {
        const { filter, page, limit } = req.query;
        const query = {};
        if (filter) {
            query["$and"] = [
                {
                    inquiryType: { $regex: filter, $options: "i" },
                },
            ];
        };
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
                populate: [
                    {
                        "path": "inquiryTypeId",
                    },
                    {
                        "path": "packageInquiryId",
                    },

                ],
            },
            model: models.Transaction,
            query: query,
        });
        return res.json({
            status: 200,
            success: true,
            data: getAllRecord,
            message: "Record(s) found successfully..",
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}