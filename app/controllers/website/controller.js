const models = require("../../models").default;
const db = require("../../middleware/db");
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

exports.getAllBlog = async (req, res, next) => {
    try {
        const { filter, page, limit } = req.query;
        const query = { status: "publish", show_in_listing: true };

        if (filter) {
            query["$or"] = [
                {
                    title: { $regex: filter, $options: "i" },
                },
                {
                    shortDescription: { $regex: filter, $options: "i" },
                },
                {
                    description: { $regex: filter, $options: "i" },
                },
                {
                    status: { $regex: filter, $options: "i" },
                },
            ];
        }
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
                lean: true,
            },
            model: models.Blog,
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
exports.getBlogDetail = async (req, res) => {
    try {

        const { slug } = req.params;
        const query = {
            slug: slug
        };

        const getData = await models.Blog.findOne({ ...query });
        return res.status(200).json({
            success: true,
            status: 200,
            data: getData,
            message: "Record found Successfully",
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

exports.getAllFaq = async (req, res, next) => {
    try {

        const { filter, page, limit, faqType } = req.query;
        const query = {}

        if (filter) {
            query["or"] = [
                {
                    title: { $regex: filter, $options: "i" }
                },
                {
                    question: { $regex: filter, $options: "i" },
                },
                {
                    answer: { $regex: filter, $options: "i" },
                }
            ];
        }
        if (faqType) {
            query["faqType"] = faqType;
        }
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
                populate: [
                    {
                        "path": "faqType"
                    }
                ]
            },
            model: models.FAQ,
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
        })

    }
}

exports.getAllFaqType = async (req, res, next) => {
    try {

        const { filter, page, limit } = req.query;
        const query = {};
        if (filter) {
            query["$or"] = [
                {
                    name: { $regex: filter, $options: "i" },
                }
            ];
        }
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
            },
            model: models.FAQTypes,
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

exports.getAllImageGallery = async (req, res, next) => {
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
                        "path": "type",
                        "select": "name"
                    },

                ],
            },
            model: models.ImageGallery,
            query: query,
        });
        for (let index = 0; index < getAllRecord.docs.length; index++) {
            const getGallery = await models.ImageGalleryBunch.findOne({ imageGalleryId: getAllRecord.docs[index]._id });
            getAllRecord.docs[index].gallery = getGallery && getGallery.gallery.length > 0 ? getGallery.gallery : [];
        }
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

exports.getAllVideoGallery = async (req, res, next) => {
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

exports.getAllCategoryVideoGallery = async (req, res, next) => {
    try {
        const getAllCategory = await db.getAll({ model: models.VideoGalleryCategory, query: {} });
        const { filter, page, limit } = req.query;
        const query = {};
        if (filter) {
            query["$or"] = [
                {
                    description: { $regex: filter, $options: "i" },
                },
            ];
        }
        if (getAllCategory && getAllCategory.length > 0) {
            const response = [];
            for (let index = 0; index < getAllCategory.length; index++) {
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
                    query: {
                        videoCategoryId: getAllCategory[index]._id
                    },
                });
                for (let index = 0; index < getAllRecord.docs.length; index++) {
                    getAllRecord.docs[index].video = getAllRecord.docs[index].video;
                }
                console.log((getAllRecord.docs.length))
                response.push({
                    categoryId: getAllCategory[index]._id,
                    categoryName: getAllCategory[index].name,
                    videoGallery: getAllRecord.docs
                });
            }
            return res.json({
                status: 200,
                success: true,
                data: response,
                message: "Record(s) found successfully.",
            });
        } else {
            return res.json({
                status: 400,
                success: true,
                data: [],
                message: "Record(s) not found.",
            });
        }
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}

exports.getAllCategoryImageGallery = async (req, res, next) => {
    try {
        const getAllCategory = await db.getAll({ model: models.ImageGalleryCategory, query: {} });
        const { filter, page, limit } = req.query;
        const query = {};
        if (filter) {
            // query["$or"] = [
            //     {
            //         description: { $regex: filter, $options: "i" },
            //     },
            // ];
        }
        if (getAllCategory && getAllCategory.length > 0) {
            const response = [];
            for (let index = 0; index < getAllCategory.length; index++) {
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
                                "path": "type",
                                "select": "name"
                            },

                        ],
                    },
                    model: models.ImageGallery,
                    query: {
                        type: getAllCategory[index]._id
                    },
                });
                console.log((getAllRecord.docs.length))
                response.push({
                    categoryId: getAllCategory[index]._id,
                    categoryName: getAllCategory[index].name,
                    imageGallery: getAllRecord.docs
                });
            }
            return res.json({
                status: 200,
                success: true,
                data: response,
                message: "Record(s) found successfully.",
            });
        } else {
            return res.json({
                status: 400,
                success: true,
                data: [],
                message: "Record(s) not found.",
            });
        }
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}

exports.getAllAirportsV2 = async (req, res) => {
    try {

        const {filter, page, limit} = req.query;
        const query = {'iata': {'$ne': '\\N'}};

        if (filter) {
            query["$or"] = [
                {
                    airportId: { $regex: `^${filter}`, $options: "i" },
                },
                {
                    name: { $regex: `^${filter}`, $options: "i" },
                },
                {
                    city: { $regex: `^${filter}`, $options: "i" },
                },
                {
                    iata: { $regex: `^${filter}`, $options: "i" },
                }
            ];
        } else {
            query["$or"] = [
                {city: { $in : ['Chicago', 'New York', 'California', 'Makkah', 'Madinah', 'Riyadh', 'Jeddah', 'Istanbul', 'Dubai', 'Abu Dhabi']}}
            ];
        }

        const getAllRecord = await db.get(
          {
              page: page || 1,
              limit: limit || 10,
              lean: true,
          },
          models.Airport,
          {
              ...query,
          }
        );
        return res.json({
            status: 200,
            success: true,
            data: getAllRecord,
            message: "Record(s) found successfully.",
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

exports.getAllAirports = async (req, res) => {
    try {
        const { filter, page, limit } = req.query;
        console.log(filter);
        const query = {};
        const data = {
            filter
        }
        let filterQuery = await db.checkQueryString({
            ...data,
            fields: "name,city,iata",
        })
        if (filter) {
            query["$or"] = [
                {
                    airportId: { $regex: `^${filter}`, $options: "i" },
                },
                {
                    name: { $regex: `^${filter}`, $options: "i" },
                },
                {
                    city: { $regex: `^${filter}`, $options: "i" },
                },
                {
                    iata: { $regex: `^${filter}`, $options: "i" },
                },
                // {
                //     country: { $regex: filter, $options: "i" },
                // },
                // {
                //     icao: { $regex: filter, $options: "i" },
                // },
                // {
                //     lat: { $regex: filter, $options: "i" },
                // },
                // {
                //     long: { $regex: filter, $options: "i" },
                // },
                // {
                //     altitude: { $regex: filter, $options: "i" },
                // },
                // {
                //     timezone: { $regex: filter, $options: "i" },
                // },
                // {
                //     dst: { $regex: filter, $options: "i" },
                // },
                // {
                //     databaseTimezone: { $regex: filter, $options: "i" },
                // },
                // {
                //     type: { $regex: filter, $options: "i" },
                // },
                // {
                //     source: { $regex: filter, $options: "i" },
                // },
            ];
        }
        console.log("filterQuery", JSON.stringify(filterQuery, null, 2));
        const getLngth = await models.Airport.find().count();
        console.log("getLngth", getLngth);
        console.log(JSON.stringify(query, null, 2));
        const getAllRecord = await db.get(
            {
                page: page || 1,
                limit: limit || 10,
                lean: true,
            },
            models.Airport,
            {
                ...query,
            }
        );
        return res.json({
            status: 200,
            success: true,
            data: getAllRecord,
            message: "Record(s) found successfully.",
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

exports.getAllCountry = async (req, res) => {
    try {
        const { filter, page, limit } = req.query;
        console.log(filter);
        const query = {};
        if (filter) {
            query["$or"] = [
                {
                    name: { $regex: `^${filter}`, $options: "i" },
                },
            ];
        }
        const getLngth = await models.Country.find().count();
        console.log("getLngth", getLngth);
        console.log(JSON.stringify(query, null, 2));
        const getAllRecord = await db.get(
            {
                page: page || 1,
                limit: limit || 10,
                lean: true,
            },
            models.Country,
            {
                ...query,
            }
        );
        return res.json({
            status: 200,
            success: true,
            data: getAllRecord,
            message: "Record(s) found successfully.",
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

exports.getAllFAQBasedOnFAQTypes = async (req, res, next) => {
    try {
        const getAllFAQType = await db.getAll({ model: models.FAQTypes, query: {} });
        const query = {};
        if (getAllFAQType && getAllFAQType.length > 0) {
            const response = [];
            for (let index = 0; index < getAllFAQType.length; index++) {
                const getAllRecord = await db.getAll({ model: models.FAQ, query: { faqType: getAllFAQType[index]._id } });
                console.log((getAllRecord.length))
                response.push({
                    FAQTypeId: getAllFAQType[index]._id,
                    FAQTypeName: getAllFAQType[index].name,
                    FAQ: getAllRecord
                });
            }
            return res.json({
                status: 200,
                success: true,
                data: response,
                message: "Record(s) found successfully.",
            });
        } else {
            return res.json({
                status: 400,
                success: true,
                data: [],
                message: "Record(s) not found.",
            });
        }
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}

exports.getAllReviews = async (req, res) => {
    try {
        const { filter, page, limit } = req.query;
        console.log(filter);
        const query = {};
        if (filter) {
            query["$or"] = [
                {
                    name: { $regex: `^${filter}`, $options: "i" },
                },
            ];
        }
        const getLngth = await models.Country.find().count();
        console.log("getLngth", getLngth);
        console.log(JSON.stringify(query, null, 2));
        const getAllRecord = await db.get(
            {
                page: page || 1,
                limit: limit || 10,
                lean: true,
            },
            models.Reviews,
            {
                ...query,
            }
        );
        return res.json({
            status: 200,
            success: true,
            data: getAllRecord,
            message: "Record(s) found successfully.",
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

exports.getAllPackages = async (req, res) => {
    try {
        const { filter, page, limit, forType, umrahSubType } = req.query;
        const query = {
            isActive: true
        };
        // if (filter) {
        //     query["$or"] = [
        //         {
        //             name: { $regex: `^${filter}`, $options: "i" },
        //         },
        //     ];
        // }
        if (forType) {
            query["forType"] = forType;
            if (forType == "Umrah") {
                if (umrahSubType) {
                    query["umrahSubType"] = umrahSubType
                }
            }
        }
        let paginateObj = { page: page, limit: limit }

        let filerObject = {
            lean: true,
            sort: "position",
            order: 1,
            populate: [
                {
                    "path": "packageIcon",
                },
            ]
        }
        if (page && limit) {
            filerObject = { ...paginateObj, ...filerObject, }
        }
        console.log(JSON.stringify(query, null, 2));
        const getAllRecord = await db.get(
            filerObject,
            models.PackageDetails,
            {
                ...query,
            }
        );
        if (getAllRecord && getAllRecord.docs.length > 0) {
            for (let index = 0; index < getAllRecord.docs.length; index++) {
                const query = {
                    packageId: getAllRecord.docs[index]._id
                };
                const getRecordsInPackageBoxDetails = await models.PackageBoxDetails.find(query);
                const getRecordsInPackageAdditionalInfo = await models.PackageAdditionalInfo.find(query).sort({ "position": 1 });
                const getRecordsInPackageIncludes = await models.PackageIncludesDetails.find(query).populate("packageIcon");
                const getRecordsInPackagePricing = await models.PackagePricing.find(query).sort({ "position": 1 });
                getAllRecord.docs[index]["PackagesBoxDetails"] = getRecordsInPackageBoxDetails && getRecordsInPackageBoxDetails.length > 0 ? getRecordsInPackageBoxDetails : [];
                getAllRecord.docs[index]["PackagesAdditionalInfo"] = getRecordsInPackageAdditionalInfo && getRecordsInPackageAdditionalInfo.length > 0 ? getRecordsInPackageAdditionalInfo : [];
                getAllRecord.docs[index]["PackagesIncludes"] = getRecordsInPackageIncludes && getRecordsInPackageIncludes.length > 0 ? getRecordsInPackageIncludes : [];
                getAllRecord.docs[index]["PackagesPricing"] = getRecordsInPackagePricing && getRecordsInPackagePricing.length > 0 ? getRecordsInPackagePricing : [];
            }
        }
        return res.json({
            status: 200,
            success: true,
            data: getAllRecord,
            message: "Record(s) found successfully.",
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
exports.getPackageDetail = async (req, res) => {
    try {

        const { slug } = req.params;
        const filter = {
            populate: [
                {
                    "path": "packageIcon",
                },
            ]
        };

        //  let getData = await models.PackageDetails.findOne({...filter});
        let getData = await db.get(
            filter,
            models.PackageDetails,
            {
                slug: slug,
                isActive: true
            }
        )
        let resData = {};
        if (getData.docs && getData.docs.length) {
            resData = getData.docs[0];

            const query = {
                packageId: resData._id
            };
            const getRecordsInPackageBoxDetails = await models.PackageBoxDetails.find(query);
            const getRecordsInPackageAdditionalInfo = await models.PackageAdditionalInfo.find(query).sort({ "position": 1 });
            const getRecordsInPackageIncludes = await models.PackageIncludesDetails.find(query).populate("packageIcon");
            const getRecordsInPackagePricing = await models.PackagePricing.find(query).sort({ "position": 1 });
            resData.PackagesBoxDetails = getRecordsInPackageBoxDetails && getRecordsInPackageBoxDetails.length > 0 ? getRecordsInPackageBoxDetails : [];
            resData.PackagesAdditionalInfo = getRecordsInPackageAdditionalInfo && getRecordsInPackageAdditionalInfo.length > 0 ? getRecordsInPackageAdditionalInfo : [];
            resData.PackagesIncludes = getRecordsInPackageIncludes && getRecordsInPackageIncludes.length > 0 ? getRecordsInPackageIncludes : [];
            resData.PackagesPricing = getRecordsInPackagePricing && getRecordsInPackagePricing.length > 0 ? getRecordsInPackagePricing : [];
        }


        return res.status(200).json({
            success: true,
            status: 200,
            data: resData,
            message: "Record found Successfully",
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
exports.getPrivacyPolicy = async (req, res) => {
    try {
        const { domain } = req.query;
        let query={}
        if(domain){
            query={domain}
        }
        const getData = await models.PrivacyPolicy.findOne(query);
        return res.status(200).json({
            success: true,
            status: 200,
            data: getData,
            message: "Record found Successfully",
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

exports.getTermsAndCondition = async (req, res) => {
    try {
        const { domain } = req.query;
        let query={}
        if(domain){
            query={domain}
        }
        const getData = await models.TermsAndCondition.findOne(query);
        return res.status(200).json({
            success: true,
            status: 200,
            data: getData,
            message: "Record found Successfully",
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
exports.getAllBanners = async (req, res) => {
        try {
            const { domain, page, limit } = req.query;
            let query={}
            if(domain){
                query={domain}
           }
            const getAllRecord = await db.getData({
                req: {
                    page: page || 1,
                    limit: limit || 10,
                },
                model: models.Banner,
                query
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
