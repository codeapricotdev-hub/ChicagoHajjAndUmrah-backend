const models = require("../../models").default;
const db = require("../../middleware/db");
const { MAIN_USER, MAIN_ADMIN } = require("../../middleware/constant");
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mongoose = require("mongoose");
const s3 = require("../../helpers/s3");

exports.create = async (req, res, nex) => {
    try {
        var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            try {

                if (!fields.packageId) {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        error: true,
                        message: "packageId is required.",
                    });
                }

                const getPackage = await db.findById(fields.packageId, models.PackageDetails);
                console.log("getPackage", getPackage);
                if (fields && fields.packageIcon) {
                    fields.packageIcon = JSON.parse(fields.packageIcon);
                }
                if (!getPackage) {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        error: true,
                        message: "Package not found with provided packageId",
                    });
                }
                const { icon } = files;
                fields.addedBy =  req.user._id,
                
                console.log("Response");
                if (icon) {
                    const location = await s3.uploadOnS3(icon.name, icon.path, "packages/packagesIncludes");
                    fields["icon"] = location.data;
                }
                console.log("fields",fields);
                const createRecord = await db.create(
                    fields,
                    models.PackageIncludesDetails
                );
                return res.status(200).json({
                    success: false,
                    status: 200,
                    data: createRecord,
                    message: "Record(s) created successfully."
                })
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
        const { filter, page, limit, packageId } = req.query;
        console.log("packageId", packageId);
        if (!packageId) {
            return res.status(400).json({
                success: false,
                status: 400,
                error: true,
                message: "packageId is required.",
            });
        }

        const query = {
            packageId: packageId
        };
        if (filter) {
            query["$or"] = [
                // {
                //     forType: { $regex: filter, $options: "i" },
                // },
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
                        "path": "packageId",
                    },
                    {
                        "path": "packageIcon",
                    }

                ],
                lean: true
            },
            model: models.PackageIncludesDetails,
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
        console.log("id box", id);
        const getPackages = await db.findData({
            req: {},
            model: models.PackageIncludesDetails,
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
                        "path": "packageId",
                    },
                    {
                        "path": "packageIcon",
                    }
                ],
                lean: true
            }
        })
        return res.status(200).json({
            success: true,
            status: 200,
            data: getPackages,
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
        const getRecordById = await db.findById(id, models.PackageIncludesDetails);
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
                const { icon } = files;


                if (icon) {
                    const location = await s3.uploadOnS3(icon.name, icon.path, "packages/packagesIncludes");
                    fields["icon"] = location.data;
                }
                if (fields && fields.packageIcon) {
                    fields.packageIcon = JSON.parse(fields.packageIcon);
                }
                const updateData = await db.update(getRecordById._id, models.PackageIncludesDetails, fields);
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
        const getRecordById = await db.findById(id, models.PackageIncludesDetails);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        if (getRecordById && getRecordById.icon !== null) {
        }

        const removeRecord = await db.delete(id, models.PackageIncludesDetails);
        console.log("removeRecord", removeRecord);
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