const models = require("../../models").default;
const db = require("../../middleware/db");
const { MAIN_USER, MAIN_ADMIN } = require("../../middleware/constant");
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const s3 = require("../../helpers/s3")
const { notifyAllActiveUsers } = require("../../helpers/mobile/userNotificationService");
const { NOTIFICATION_ACTIONS } = require("../../helpers/mobile/notificationTemplates");

exports.create = async (req, res, nex) => {
    try {
        var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            const { packageListingImage, packageHeaderImage } = files;
            try {
                if (packageListingImage) {
                    const location = await s3.uploadOnS3(packageListingImage.name, packageListingImage.path, "packages");
                    fields["packageListingImage"] = location.data;
                }

                if (packageHeaderImage) {
                    const location = await s3.uploadOnS3(packageHeaderImage.name, packageHeaderImage.path, "packages");
                    fields["packageHeaderImage"] = location.data;
                }
                if (fields && fields.packageIcon) {
                    fields.packageIcon = JSON.parse(fields.packageIcon);
                }
                const createRecord = await db.create(
                    fields,
                    models.PackageDetails
                );
                const isActive =
                    fields.isActive !== "false" &&
                    fields.isActive !== false &&
                    fields.isActive !== "0";
                if (isActive) {
                    notifyAllActiveUsers(NOTIFICATION_ACTIONS.NEW_PACKAGES_AVAILABLE, {
                        packageId: createRecord._id,
                    }).catch((error) => {
                        console.error("NEW_PACKAGES notification failed:", error.message);
                    });
                }
                return res.status(200).json({
                    success: true,
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
        const { filter, page, limit, forType, umrahSubType } = req.query;
        const query = {};
        if (filter) {
            query["$or"] = [
                {
                    forType: { $regex: filter, $options: "i" },
                },
            ];
        }

        if (forType) {
            query["forType"] = forType;
            if (forType == "Umrah") {
                if (umrahSubType) {
                    query["umrahSubType"] = umrahSubType
                }
            }
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
                        "path": "packageIcon",
                    },

                ],
                lean: true,
                sort: "position",
                order: 1
            },
            model: models.PackageDetails,
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
        const getPackages = await db.findData({
            req: {},
            model: models.PackageDetails,
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
                        "path": "packageIcon",
                    },
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
        const getRecordById = await db.findById(id, models.PackageDetails);
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
                const { packageListingImage, packageHeaderImage } = files;


                if (packageListingImage) {
                    const location = await s3.uploadOnS3(packageListingImage.name, packageListingImage.path, "packages");
                    fields["packageListingImage"] = location.data;
                }

                if (packageHeaderImage) {
                    const location = await s3.uploadOnS3(packageHeaderImage.name, packageHeaderImage.path, "packages");
                    fields["packageHeaderImage"] = location.data;
                }
                if (fields && fields.packageIcon) {
                    fields.packageIcon = JSON.parse(fields.packageIcon);
                }
                const updateData = await db.update(getRecordById._id, models.PackageDetails, fields);
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
        const getRecordById = await db.findById(id, models.PackageDetails);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        const query = {
            packageId: id
        };
        await models.PackageBoxDetails.deleteMany({ packageId: id });

        // Package PackageAdditionalInfo
        await models.PackageAdditionalInfo.deleteMany({ packageId: id });

        // Package PackageIncludesDetails
        await models.PackageIncludesDetails.deleteMany({ packageId: id });

        // Package getRecordsInPackagePricing
        await models.PackagePricing.deleteMany({ packageId: id });

        const removeRecord = await db.delete(id, models.PackageDetails);
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

exports.copyPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const copyPackageQuery = {
            packageId: id
        };
        console.log("copyPackageQuery", copyPackageQuery);
        const getRecordById = await db.findById(id, models.PackageDetails);
        if (!getRecordById) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: getRecordById,
                message: "Record not found by provided id.",
            });
        }
        const copyPackageId = getRecordById._id;
        delete getRecordById._id;
        const resolvePromise = [];
        console.log("getRecordById", getRecordById);
        getRecordById.isActive = false;
        const createPackageDetails = await db.create(
            getRecordById,
            models.PackageDetails
        );
        console.log("createPackageDetails", createPackageDetails);
        // Package Box Details
        const getRecordsInPackageBoxDetails = await models.PackageBoxDetails.find(copyPackageQuery);
        if (getRecordsInPackageBoxDetails && getRecordsInPackageBoxDetails.length > 0) {
            for (let index = 0; index < getRecordsInPackageBoxDetails.length; index++) {
                delete getRecordsInPackageBoxDetails[index]._id;
                getRecordsInPackageBoxDetails[index].packageId = createPackageDetails._id;
                console.log("getRecordsInPackageBoxDetails[index]", getRecordsInPackageBoxDetails[index]);
                const createObject = {
                    name: getRecordsInPackageBoxDetails[index].name,
                    image: getRecordsInPackageBoxDetails[index].image,
                    addedBy: createPackageDetails.addedBy,
                    packageId: createPackageDetails._id,
                }
                const cretaeBoDetails = await db.create(createObject, models.PackageBoxDetails);
                console.log("cretaeBoDetails", cretaeBoDetails);
            }
        }

        // Package PackageAdditionalInfo
        const getRecordsInPackageAdditionalInfo = await models.PackageAdditionalInfo.find(copyPackageQuery);
        if (getRecordsInPackageAdditionalInfo && getRecordsInPackageAdditionalInfo.length > 0) {
            for (let index = 0; index < getRecordsInPackageAdditionalInfo.length; index++) {
                delete getRecordsInPackageAdditionalInfo[index]._id;
                getRecordsInPackageAdditionalInfo[index].packageId = createPackageDetails._id;
                console.log("getRecordsInPackageAdditionalInfo[index]", getRecordsInPackageAdditionalInfo[index]);
                const createObject = {
                    tabTitle: getRecordsInPackageAdditionalInfo[index].tabTitle,
                    description: getRecordsInPackageAdditionalInfo[index].description,
                    position: getRecordsInPackageAdditionalInfo[index].position,
                    addedBy: createPackageDetails.addedBy,
                    packageId: createPackageDetails._id,
                }
                const cretaeAdditionalInfo = await db.create(createObject, models.PackageAdditionalInfo);
                console.log("cretaeAdditionalInfo", cretaeAdditionalInfo);
            }
        }

        // Package PackageIncludesDetails
        const getRecordsInPackageIncludes = await models.PackageIncludesDetails.find(copyPackageQuery);
        if (getRecordsInPackageIncludes && getRecordsInPackageIncludes.length > 0) {
            for (let index = 0; index < getRecordsInPackageIncludes.length; index++) {
                delete getRecordsInPackageIncludes[index]._id;
                getRecordsInPackageIncludes[index].packageId = createPackageDetails._id;
                console.log("getRecordsInPackageIncludes[index]", getRecordsInPackageIncludes[index]);
                const createObject = {
                    icon: getRecordsInPackageIncludes[index].icon,
                    description: getRecordsInPackageIncludes[index].description,
                    addedBy: createPackageDetails.addedBy,
                    packageId: createPackageDetails._id,
                }
                const createPackageIncludes = await db.create(createObject, models.PackageIncludesDetails);
                console.log("createPackageIncludes", createPackageIncludes);
            }
        }

        // Package getRecordsInPackagePricing
        const getRecordsInPackagePricing = await models.PackagePricing.find(copyPackageQuery);
        if (getRecordsInPackagePricing && getRecordsInPackagePricing.length > 0) {
            for (let index = 0; index < getRecordsInPackagePricing.length; index++) {
                delete getRecordsInPackagePricing[index]._id;
                getRecordsInPackagePricing[index].packageId = createPackageDetails._id;
                console.log("getRecordsInPackagePricing[index]", getRecordsInPackagePricing[index]);
                const createObject = {
                    title: getRecordsInPackagePricing[index].title,
                    peoplePerRoom: getRecordsInPackagePricing[index].peoplePerRoom,
                    pricePerPerson: getRecordsInPackagePricing[index].pricePerPerson,
                    packageId: createPackageDetails._id,
                    addedBy: createPackageDetails.addedBy,
                }
                const createPricing = await db.create(createObject, models.PackagePricing);
                console.log("createPricing", createPricing);
            }
        }
        console.log("resolvePromise", resolvePromise);
        return res.status(200).json({
            success: true,
            status: 200,
            data: createPackageDetails,
            message: "Package copy successfully.",
        });
        Promise.all(resolvePromise).then((result) => {
        }).catch((error) => {
            return res.status(error.code ? error.code : 500).json({
                success: false,
                status: error.code ? error.code : 500,
                error: true,
                message: error.message,
            });
        })

    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}