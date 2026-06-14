const models = require("../../models").default;
const db = require("../../middleware/db");
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const s3 = require("../../helpers/s3")

exports.create = async (req, res, nex) => {
    try {
        var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            const { content, domain,url } = fields;
            if (!domain) {
                return res.status(404).json({
                    success: false,
                    status: 404,
                    error: true,
                    message: "Domain is required.",
                });
            }
            const { image, mobile_image } = files;

            try {
                const createObject = {
                    content,
                    domain,
                    url
                }
                if (image) {
                    const location = await s3.uploadOnS3(image.name, image.path, "banner");
                    createObject["image"] = location.data;
                }
                if (mobile_image) {
                    const mobileLocation = await s3.uploadOnS3(mobile_image.name, mobile_image.path, "mobile_banner");
                    createObject["mobile_image"] = mobileLocation.data;
                }

                const createRecord = await db.create(
                    createObject,
                    models.Banner
                );
                return res.status(201).json({
                    success: true,
                    status: 201,
                    data: createRecord,
                    message: "Record created successfully.",
                });
            } catch (error) {
                return res.status(error.code ? error.code : 500).json({
                    success: false,
                    status: error.code ? error.code : 500,
                    error: true,
                    message: error.message,
                });
            }

        });

        form.on("error", function (err) {
            return res.status(500).json({
                success: false,
                status: 500,
                error: true,
                message: err.message,
            });
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

exports.getAll = async (req, res, next) => {
    try {
        const { filter, domain,page, limit } = req.query;
        const query = { domain };
        if (!domain) {
            return res.status(404).json({
                success: false,
                status: 404,
                error: true,
                message: "Domain is required.",
            });
        }
        if (filter) {
            query["$or"] = [
                {
                    content: { $regex: filter, $options: "i" },
                }
            ];
        }
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
                lean: true
            },
            model: models.Banner,
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
        const getBanner = await db.findData({
            req: {},
            model: models.Banner,
            query: {
                _id: id
            },
            options: {
                lean: true
            }
        })
        return res.status(200).json({
            success: true,
            status: 200,
            data: getBanner,
            message: "Record fetched successfully.",
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
        const getRecordById = await db.findById(id, models.Banner);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            try {
                const { image, mobile_image } = files;
                if (image && typeof image !== "string") {
                    let filename = path.basename(getRecordById.image);

                    if (image.name !== filename) {
                        const resul = await s3.removeFromS3(filename, "banner");
                    }

                    const location = await s3.uploadOnS3(image.name, image.path, "banner");
                    fields["image"] = location.data;
                }
                if (mobile_image && typeof mobile_image !== "string") {
                    if (getRecordById.mobile_image) {
                        let filename = path.basename(getRecordById.mobile_image);

                        if (mobile_image.name !== filename) {
                            const resul = await s3.removeFromS3(filename, "mobile_banner");
                        }
                    }
                    const mobilelocation = await s3.uploadOnS3(mobile_image.name, mobile_image.path, "mobile_banner");
                    fields["mobile_image"] = mobilelocation.data;

                }
                const updateData = await db.update(getRecordById._id, models.Banner, fields);

                return res.status(200).json({
                    success: true,
                    status: 200,
                    data: updateData,
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
        });

        form.on("error", function (err) {
            return res.status(500).json({
                success: false,
                status: 500,
                error: true,
                message: err.message,
            });
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
        const getRecordById = await db.findById(id, models.Banner);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        let filename = path.basename(getRecordById.image);
        const resul = await s3.removeFromS3(filename, "banner");
        if (getRecordById.mobile_image) {
            let mobilefilename = path.basename(getRecordById.mobile_image);
            await s3.removeFromS3(mobilefilename, "mobile_banner");
        }
        const removeRecord = await db.delete(id, models.Banner);
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
