const models = require("../../models").default;
const db = require("../../middleware/db");
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const s3 = require("../../helpers/s3");

exports.create = async (req, res, nex) => {
    try {
        var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            const { description, type, videoCategoryId ,url } = fields;
            const { video } = files;

            try {
                const createObject = {
                    description,
                    videoCategoryId,
                    addedBy: req.user._id
                }

                if(url){
                    createObject['url']=url
                }

                if (video) {
                    const location = await s3.uploadOnS3(video.name, video.path, "videoGallery");
                    createObject["video"] = location.data;
                }

                const createRecord = await db.create(
                    createObject,
                    models.VideoGallery
                );

                const getGallery = await db.findData({
                    req: {},
                    model: models.VideoGallery,
                    query: {
                        _id: createRecord._id
                    },
                    options: {
                        populate: [
                            {
                                "path": "addedBy",
                                "select": "email fullName"
                            },
                            {
                                "path": "videoCategoryId",
                                "select": "name"
                            },

                        ],
                        lean: true
                    }
                })

                return res.status(201).json({
                    success: true,
                    status: 201,
                    data: getGallery,
                    message: "Record created successfully.",
                });

            } catch (error) {
                console.log('error.message :>> ', error.message);
                return res.status(error.code ? error.code : 500).json({
                    success: false,
                    status: error.code ? error.code : 500,
                    error: true,
                    message: error.message,
                });
            }

        });

        form.on("error", function (err) {
            console.log("err", err.message);
            return res.status(500).json({
                success: false,
                status: 500,
                error: true,
                message: err.message,
            });
        });
    } catch (error) {
        console.log('error.message :>> ', error.message);
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
            query["$or"] = [
                {
                    description: { $regex: filter, $options: "i" },
                },
            ];
        }
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
                lean: true,
                populate: [
                    {
                        "path": "addedBy",
                        "select": "email fullName"
                    },
                    {
                        "path": "videoCategoryId",
                        "select": "name"
                    },

                ],
            },
            model: models.VideoGallery,
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
        const getGallery = await db.findData({
            req: {},
            model: models.VideoGallery,
            query: {
                _id: id
            },
            options: {
                populate: [

                    {
                        "path": "addedBy",
                        "select": "email fullName"
                    },
                    {
                        "path": "videoCategoryId",
                        "select": "name"
                    },
                ],
                lean: true
            }
        })
        return res.status(200).json({
            success: true,
            status: 200,
            data: getGallery,
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
        const getRecordById = await db.findById(id, models.VideoGallery);
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
                const { video } = files;
                if (video) {
                    const location = await s3.uploadOnS3(video.name, video.path, "videoGallery");
                    fields["video"] = location.data;
                }
                const updateData = await db.update(getRecordById._id, models.VideoGallery, fields);
                console.log('updateData :>> ', updateData);
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
            console.log("err", err.message);
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
        const getRecordById = await db.findById(id, models.VideoGallery);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        if (getRecordById && getRecordById.video !== null) {

        }
        const removeRecord = await db.delete(id, models.VideoGallery);
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