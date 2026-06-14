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
        form.multiples = true;
        form.parse(req, async function (err, fields, files) {
            const { description, type, title } = fields;
            const { images } = files;

            try {
                const createObject = {
                    description,
                    type,
                    title,
                    addedBy: req.user._id,
                }

                // if (image) {
                //     const location = await s3.uploadOnS3(image.name, image.path, "imageGallery");
                //     createObject["image"] = location.data;
                // }
                const galleryArray = [];
                console.log("images", images.length);
                if (images && images.length > 0) {
                    for (let index = 0; index < images.length; index++) {
                        const location = await s3.uploadOnS3(images[index].name, images[index].path, "imageGallery");
                        galleryArray.push(location.data);
                    }
                } else {
                    const location = await s3.uploadOnS3(images.name, images.path, "imageGallery");
                    galleryArray.push(location.data);
                }
                createObject["images"] = galleryArray;
                const createRecord = await db.create(
                    createObject,
                    models.ImageGallery
                );
                return res.status(201).json({
                    success: true,
                    status: 201,
                    data: createRecord,
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
                populate: [
                    {
                        "path": "addedBy",
                        "select": "email fullName"
                    },
                    {
                        "path": "type",
                        "select": "name"
                    },

                ],
                lean: true
            },
            model: models.ImageGallery,
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
            model: models.ImageGallery,
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
                        "path": "type",
                        "select": "name"
                    },
                ],
                lean: true
            }
        });
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
        const getRecordById = await db.findById(id, models.ImageGallery);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        var form = new formidable.IncomingForm();
        form.multiples = true;
        form.parse(req, async function (err, fields, files) {
            try {
                const { images } = files;
                const galleryArray = [];
                if (images && images.length > 0) {
                    for (let index = 0; index < images.length; index++) {
                        const location = await s3.uploadOnS3(images[index].name, images[index].path, "imageGallery");
                        galleryArray.push(location.data);
                    }
                } else {
                    const location = await s3.uploadOnS3(images.name, images.path, "imageGallery");
                    galleryArray.push(location.data);
                }
                fields["images"] = galleryArray;
                console.log("fields", fields);
                const updateData = await db.update(getRecordById._id, models.ImageGallery, fields);
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
        const getRecordById = await db.findById(id, models.ImageGallery);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        const removeRecord = await db.delete(id, models.ImageGallery);
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

exports.addGallery = async (req, res, next) => {
    try {
        const { imageGalleryId } = req.params;
        console.log("req.body", req.body);
        var form = new formidable.IncomingForm();
        form.multiples = true;
        form.parse(req, async function (err, fields, files) {
            const { images } = files;
            const galleryArray = [];
            console.log("images", images.length);
            if (images && images.length > 0) {
                for (let index = 0; index < images.length; index++) {
                    const location = await s3.uploadOnS3(images[index].name, images[index].path, "imageGallery");
                    galleryArray.push(location.data);
                }
            } else {
                const location = await s3.uploadOnS3(images.name, images.path, "imageGallery");
                galleryArray.push(location.data);
            }
            console.log("galleryArray", galleryArray);
            const createObject = {
                imageGalleryId: imageGalleryId,
                gallery: galleryArray,
                addedBy: req.user._id,
            }
            // const getGallery = await db.findData({
            //     req: {},
            //     model: models.ImageGalleryBunch,
            //     query: {
            //         imageGalleryId: imageGalleryId,
            //     },
            //     options: {
            //         lean: true
            //     }
            // })
            const getGallery = await models.ImageGalleryBunch.findOne({ imageGalleryId: imageGalleryId }).lean();
            if (getGallery) {
                let updateGalleryArray = [];
                console.log(getGallery,);
                console.log("getGallery.gallery", getGallery.gallery);
                updateGalleryArray = [...getGallery.gallery, ...galleryArray];
                console.log("updateGalleryArray", updateGalleryArray);
                const updateData = await db.findOneAndUpdate({ filter: { imageGalleryId: imageGalleryId }, model: models.ImageGalleryBunch, update: { gallery: updateGalleryArray } });
                console.log('updateData :>> ', updateData);
                return res.status(200).json({
                    success: true,
                    status: 200,
                    data: updateData,
                    message: "Record created successfully.",
                });

            } else {
                try {
                    const createRecord = await db.create(
                        createObject,
                        models.ImageGalleryBunch
                    );
                    return res.status(200).json({
                        success: true,
                        status: 201,
                        data: createRecord,
                        message: "Record created successfully.",
                    });
                } catch (error) {
                    return res.status(500).json({
                        success: false,
                        status: 500,
                        error: true,
                        message: error.message,
                    });
                }
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
}