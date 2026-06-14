const models = require("../../models").default;
const db = require("../../middleware/db");
const { MAIN_USER, MAIN_ADMIN } = require("../../middleware/constant");

exports.create = async (req, res, nex) => {
    try {
        const getRecord = await db.findData({
            req: {},
            model: models.VideoGalleryCategory,
            query: {
                name: req.body.name,
            },
        });

        console.log("getRecord :>> ", getRecord);
        if (getRecord) {
            return res.json({
                status: 400,
                success: false,
                error: false,
                message: "Record with name already exists.",
            });
        } else {
            req.body.addedBy = req.user._id;
            const createRecord = await db.create(
                req.body,
                models.VideoGalleryCategory
            );
            if (createRecord) {
                return res.status(201).json({
                    success: true,
                    status: 201,
                    data: createRecord,
                    message: "Record created successfully.",
                });
            }
        }
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};

exports.getAll = async (req, res, next) => {
    try {
        const { filter, page, limit } = req.query;
        const query = {};
        if (filter) {
            query["$and"] = [
                {
                    name: { $regex: filter, $options: "i" },
                },
            ];
        }
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
            },
            model: models.VideoGalleryCategory,
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
};

exports.getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const getRecordById = await db.findById(id, models.VideoGalleryCategory);
        return res.status(200).json({
            success: true,
            status: 200,
            data: getRecordById,
            message: "Record found successfully.",
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

exports.edit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const getRecordById = await db.findById(id, models.VideoGalleryCategory);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        const updateRecord = await db.updateData(
            id,
            models.VideoGalleryCategory,
            req.body
        );
        return res.status(200).json({
            success: true,
            status: 200,
            data: updateRecord,
            message: "Record updated successfully.",
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

exports.remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const getRecordById = await db.findById(id, models.VideoGalleryCategory);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        const removeRecord = await db.delete(id, models.VideoGalleryCategory);
        return res.status(200).json({
            success: true,
            status: 200,
            data: removeRecord,
            message: "Record deleted successfully.",
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
