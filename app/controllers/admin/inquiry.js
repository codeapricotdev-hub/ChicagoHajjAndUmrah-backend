const models = require("../../models").default;
const db = require("../../middleware/db");
const { MAIN_USER, MAIN_ADMIN } = require("../../middleware/constant");
const moment = require('moment')
const excelJS = require("exceljs");
const RoleModel = require("../../models/role")
exports.getAll = async (req, res, next) => {
    try {
        const { search, page, limit, type, startDate, endDate, date, role } = req.query;
        const filter = search;
        console.log("filter", filter);
        if (type === null || type === undefined || type === "") {
            return res.status(400).json({
                status: 400,
                success: false,
                data: null,
                message: "Inquiry type is required.",
            });
        }
        const query = {};
        query["type"] = type
        if (startDate && endDate) {
            query["createdAt"] = {
                $gte: moment(startDate).startOf('day').toDate(),
                $lt: moment(endDate).endOf('day').toDate()
            }
        }
        if (filter) {
            query["$or"] = [
                {
                    refId: { $regex: filter, $options: "i" },
                },
                {
                    fullName: { $regex: filter, $options: "i" },
                },
                {
                    email: { $regex: filter, $options: "i" },
                },
                {
                    mobileNumber: { $regex: filter, $options: "i" },
                },
                {
                    tripType: { $regex: filter, $options: "i" },
                },
                {
                    travelClass: { $regex: filter, $options: "i" },
                },
                {
                    mobileNumber: { $regex: filter, $options: "i" },
                },
            ];
        }
        const getRole = await RoleModel.findById(req.user.role);
        console.log("getRole", getRole);
        if (getRole && getRole.name == "admin") {

        } else {
            // const getAssignedUserIquiry = await models.InquiryAssignee.find({ userId: req.user._id }).select("inquiryId");
            // console.log("getAssignedUserIquiry", getAssignedUserIquiry.length);
            // const Ids = [];
            // for (let index = 0; index < getAssignedUserIquiry.length; index++) {
            //     Ids.push(getAssignedUserIquiry[index].inquiryId);
            // }
            // query["assignedUser"] = {$in:[req.user._id]},
            // query["isAssignee"] = false
            query["$and"] = [
                {
                    "assignedUser": req.user._id
                },
                {

                    "isAssignee": false,
                },
            ]
            // query["_id"] = { $in: Ids }
        }
        console.log("query", JSON.stringify(query, null, 2));
        const getAllRecord = await db.getData({
            req: {
                page: page || 1,
                limit: limit || 10,
                sort: "createdAt",
                order: -1,
                lean: true,
                populate: [
                    {
                        "path": "assignedUser",
                        "select": "_id email fullName"
                    }
                ]
            },
            model: models.Inquiry,
            query: query,
        });
        // if (getAllRecord && getAllRecord.docs && getAllRecord.docs.length > 0) {
        //     for (let index = 0; index < getAllRecord.docs.length; index++) {
        //         const queryAssignee = {
        //             inquiryId: getAllRecord.docs[index]._id
        //         };
        //         const getRole = await RoleModel.findById(req.user.role);
        //         if (getRole && getRole.name == "admin") {

        //         } else {
        //             queryAssignee["userId"] = req.user._id
        //         }
        //         console.log("queryAssignee", queryAssignee);
        //         const getAssignedUser = await models.InquiryAssignee.findOne(queryAssignee).sort({ createdAt: -1 });
        //         if (getAssignedUser) {
        //             const getUser = await models.User.findOne({ _id: getAssignedUser.userId });
        //             getAllRecord.docs[index]["assignee"] = {
        //                 email: getUser?.email,
        //                 fullName: getUser?.fullName,
        //                 userId: getUser?._id,
        //             }
        //         } else {
        //             getAllRecord.docs[index]["assignee"] = {}
        //         }
        //     }
        // }
        // if(getRole && getRole.name !== "admin") {
        //     const getAllUnAssignedInquiry = await models.Inquiry
        // }
        if (getAllRecord && getAllRecord.docs && getAllRecord.docs.length > 0) {
            for (let index = 0; index < getAllRecord.docs.length; index++) {
                getAllRecord.docs[index]["assignedUser"] = getAllRecord.docs[index]["assignedUser"] !== null && getAllRecord.docs[index]["assignedUser"] !== undefined && getAllRecord.docs[index]["assignedUser"] !== "" ? getAllRecord.docs[index]["assignedUser"] : {};
            }
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

exports.getAllInquiry = async (req, res) => {
    try {
        const { search, page, limit, type, startDate, endDate, date, role } = req.query;
        const filter = search;
        console.log("filter", filter);
        if (type === null || type === undefined || type === "") {
            return res.status(400).json({
                status: 400,
                success: false,
                data: null,
                message: "Inquiry type is required.",
            });
        }
        const getRole = await RoleModel.findById(req.user.role);
        console.log("getRole", getRole);
        if (getRole && getRole.name == "admin") {
            const query = {};
            query["type"] = type
            if (startDate && endDate) {
                query["createdAt"] = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lt: moment(endDate).endOf('day').toDate()
                }
            }
            if (filter) {
                query["$or"] = [
                    {
                        refId: { $regex: filter, $options: "i" },
                    },
                    {
                        fullName: { $regex: filter, $options: "i" },
                    },
                    {
                        email: { $regex: filter, $options: "i" },
                    },
                    {
                        mobileNumber: { $regex: filter, $options: "i" },
                    },
                    {
                        tripType: { $regex: filter, $options: "i" },
                    },
                    {
                        travelClass: { $regex: filter, $options: "i" },
                    },
                    {
                        mobileNumber: { $regex: filter, $options: "i" },
                    },
                ];
            }

            console.log("query", JSON.stringify(query, null, 2));
            const getAllRecord = await db.getData({
                req: {
                    page: page || 1,
                    limit: limit || 10,
                    sort: "createdAt",
                    order: -1,
                    lean: true,
                    populate: [
                        {
                            "path": "assignedUser",
                            "select": "_id email fullName"
                        }
                    ]
                },
                model: models.Inquiry,
                query: query,
            });
            // if (getAllRecord && getAllRecord.docs && getAllRecord.docs.length > 0) {
            //     for (let index = 0; index < getAllRecord.docs.length; index++) {
            //         getAllRecord.docs[index]["assignedUser"] = getAllRecord.docs[index]["assignedUser"] !== null && getAllRecord.docs[index]["assignedUser"] !== undefined && getAllRecord.docs[index]["assignedUser"] !== "" ? getAllRecord.docs[index]["assignedUser"] : {};
            //     }
            // }
            return res.json({
                status: 200,
                success: true,
                data: getAllRecord,
                message: "Record(s) found successfully..",
            });
        } else {
            //const unAssignedInquiryQuery = {};
            const assignedInquiryQuery = {};
            // unAssignedInquiryQuery["type"] = type;
            // unAssignedInquiryQuery["isAssignee"] = false

            assignedInquiryQuery["type"] = type
            // assignedInquiryQuery["assignedUser"] = req.user._id;
            // assignedInquiryQuery["isAssignee"] = true;
            assignedInquiryQuery['$or']=[{assignedUser:req.user._id},{isAssignee:false}]
            if (startDate && endDate) {
                // unAssignedInquiryQuery["createdAt"] = {
                //     $gte: moment(startDate).startOf('day').toDate(),
                //     $lt: moment(endDate).endOf('day').toDate()
                // };
                assignedInquiryQuery["createdAt"] = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lt: moment(endDate).endOf('day').toDate()
                };
            }
            if (filter) {
                // unAssignedInquiryQuery["$or"] = [
                //     {
                //         refId: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         fullName: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         email: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         mobileNumber: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         tripType: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         travelClass: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         mobileNumber: { $regex: filter, $options: "i" },
                //     },
                // ];

                assignedInquiryQuery["$or"] = [
                    {
                        refId: { $regex: filter, $options: "i" },
                    },
                    {
                        fullName: { $regex: filter, $options: "i" },
                    },
                    {
                        email: { $regex: filter, $options: "i" },
                    },
                    {
                        mobileNumber: { $regex: filter, $options: "i" },
                    },
                    {
                        tripType: { $regex: filter, $options: "i" },
                    },
                    {
                        travelClass: { $regex: filter, $options: "i" },
                    },
                    {
                        mobileNumber: { $regex: filter, $options: "i" },
                    },
                ];
            }
          //  const getAllUnAssignedInquiry = await models.Inquiry.find(unAssignedInquiryQuery).sort({ createdAt: -1 }).lean(true);
           // const userAssignedInquiry = await models.Inquiry.find(assignedInquiryQuery).sort({ createdAt: -1 }).populate("assignedUser", "_id email fullName");
           // console.log("getAllUnAssignedInquiry", getAllUnAssignedInquiry.length);
            // console.log("userAssignedInquiry", userAssignedInquiry.length);
            // for (let index = 0; index < getAllUnAssignedInquiry.length; index++) {
            //     getAllUnAssignedInquiry[index]["assignedUser"] = getAllUnAssignedInquiry[index]["assignedUser"] !== null && getAllUnAssignedInquiry[index]["assignedUser"] !== undefined && getAllUnAssignedInquiry[index]["assignedUser"] !== "" ? getAllUnAssignedInquiry[index]["assignedUser"] : {};
            // }
            //const finalResponseArray = [...getAllUnAssignedInquiry, ...userAssignedInquiry];
            // const finalResponseArray = userAssignedInquiry;
            // const finalPaginationData = paginate(finalResponseArray, page, limit);
            //console.log("finalResponseArray", finalPaginationData.length);

            // const sortedItem = sortedItems(finalPaginationData.items);
            // const response = {
            //     docs: sortedItem, //finalPaginationData.items,
            //     totalDocs: finalResponseArray.length,
            //     limit: parseInt(limit),
            //     page: parseInt(page),
            //     totalPages: finalPaginationData.totalPages,
            //     pagingCounter: "",
            //     "hasPrevPage": finalPaginationData.previousPage === null ? false : true,
            //     "hasNextPage": finalPaginationData.nextPage === null ? false : true,
            //     "prevPage": parseInt(finalPaginationData.previousPage),
            //     "nextPage": parseInt(finalPaginationData.nextPage)
            // }
            const getAllRecord = await db.getData({
                req: {
                    page: page || 1,
                    limit: limit || 10,
                    sort: "createdAt",
                    order: -1,
                    lean: true,
                    populate: [
                        {
                            "path": "assignedUser",
                            "select": "_id email fullName"
                        }
                    ]
                },
                model: models.Inquiry,
                query: assignedInquiryQuery,
            });
            return res.json({
                status: 200,
                success: true,
                data: getAllRecord,
                message: "Record(s) found successfully..",
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

exports.getAllPackagesInquiry = async (req, res) => {
    try {

        const { search, page, limit, type, startDate, endDate, date, role } = req.query;
        const filter = search;
       // console.log("filter", filter);
        if (type === null || type === undefined || type === "") {
            return res.status(400).json({
                status: 400,
                success: false,
                data: null,
                message: "Inquiry type is required.",
            });
        }
        const getRole = await RoleModel.findById(req.user.role);
        // console.log("getRole", getRole);
        if (getRole && getRole.name == "admin") {
            const query = {};
            if (startDate && endDate) {
                query["createdAt"] = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lt: moment(endDate).endOf('day').toDate()
                }
            }
            if (filter) {
                query["$or"] = [
                    {
                        fullName: { $regex: filter, $options: "i" },
                    },
                    {
                        email: { $regex: filter, $options: "i" },
                    },
                    {
                        travellingFrom: { $regex: filter, $options: "i" },
                    },
                    {
                        refId: { $regex: filter, $options: "i" },
                    },
                ];
            }

            if (type) {
                const ids = [];
                const getPackagesId = await models.PackageDetails.find({ forType: type }).select("_id");
                for (let index = 0; index < getPackagesId.length; index++) {
                    ids.push(getPackagesId[index]._id);
                }
                query["packageId"] = {
                    $in: ids
                }
            }
            // console.log("query", JSON.stringify(query, null, 2));
            const getAllRecord = await db.getData({
                req: {
                    page: page || 1,
                    limit: limit || 10,
                    sort: "createdAt",
                    order: -1,
                    lean: true,
                    populate: [
                        {
                            "path": "assignedUser",
                            "select": "_id email fullName"
                        }
                    ]
                },
                model: models.PackageInquiry,
                query: query,
            });

            //const getAllRecord={docs:[]}
            // getAllRecord.docs = await models.PackageInquiry.find(query).sort({ "createdAt": -1 }).populate("assignedUser", "_id email fullName").skip((page-1)*limit).limit(limit);

            // if (getAllRecord && getAllRecord.docs && getAllRecord.docs.length > 0) {
            //     for (let index = 0; index < getAllRecord.docs.length; index++) {
            //         getAllRecord.docs[index]["assignedUser"] = getAllRecord.docs[index]["assignedUser"] !== null && getAllRecord.docs[index]["assignedUser"] !== undefined && getAllRecord.docs[index]["assignedUser"] !== "" ? getAllRecord.docs[index]["assignedUser"] : {};
            //     }
            // }
            
            // const finalPaginationData = paginate(getAllRecord.docs, page, limit);
            // const sortedItem = sortedItems(finalPaginationData.items);
           
            // const response = {
            //     docs: sortedItem,
            //     totalDocs: getAllRecord.docs.length,
            //     limit: parseInt(limit),
            //     page: parseInt(page),
            //     totalPages: finalPaginationData.totalPages,
            //     pagingCounter: "",
            //     "hasPrevPage": finalPaginationData.previousPage === null ? false : true,
            //     "hasNextPage": finalPaginationData.nextPage === null ? false : true,
            //     "prevPage": parseInt(finalPaginationData.previousPage),
            //     "nextPage": parseInt(finalPaginationData.nextPage)
            // }
            // return res.json({
            //     status: 200,
            //     success: true,
            //     data: response,
            //     message: "Record(s) found successfully..",
            // });


            return res.json({
                status: 200,
                success: true,
                data: getAllRecord,
                message: "Record(s) found successfully..",
            });
        } else {
           // const unAssignedInquiryQuery = {};
            const assignedInquiryQuery = {};
            //unAssignedInquiryQuery["isAssignee"] = false

            // assignedInquiryQuery["assignedUser"] = req.user._id;
            // assignedInquiryQuery["isAssignee"] = true;
            // ssignedInquiryQuery["assignedUser"] = req.user._id;
            // assignedInquiryQuery["isAssignee"] = true;
            assignedInquiryQuery["$or"]=[
                {assignedUser:req.user._id},
                {isAssignee:false}]

            if (startDate && endDate) {
                // unAssignedInquiryQuery["createdAt"] = {
                //     $gte: moment(startDate).startOf('day').toDate(),
                //     $lt: moment(endDate).endOf('day').toDate()
                // };
                assignedInquiryQuery["createdAt"] = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lt: moment(endDate).endOf('day').toDate()
                };
            }
            if (filter) {
                // unAssignedInquiryQuery["$or"] = [
                //     {
                //         fullName: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         email: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         travellingFrom: { $regex: filter, $options: "i" },
                //     },
                //     {
                //         refId: { $regex: filter, $options: "i" },
                //     },
                // ];

                assignedInquiryQuery["$or"] = [
                    {
                        fullName: { $regex: filter, $options: "i" },
                    },
                    {
                        email: { $regex: filter, $options: "i" },
                    },
                    {
                        travellingFrom: { $regex: filter, $options: "i" },
                    },
                    {
                        refId: { $regex: filter, $options: "i" },
                    },
                ];
            }


            if (type) {
                const ids = [];
                const getPackagesId = await models.PackageDetails.find({ forType: type }).select("_id");
                for (let index = 0; index < getPackagesId.length; index++) {
                    ids.push(getPackagesId[index]._id);
                }
                // unAssignedInquiryQuery["packageId"] = {
                //     $in: ids
                // };

                assignedInquiryQuery["packageId"] = {
                    $in: ids
                };
            }

            //const getAllUnAssignedInquiry = await models.PackageInquiry.find(unAssignedInquiryQuery).sort({ "createdAt": -1 }).lean(true);
            //const userAssignedInquiry = await models.PackageInquiry.find(assignedInquiryQuery).sort({ "createdAt": -1 }).populate("assignedUser", "_id email fullName");
           // console.log("getAllUnAssignedInquiry", getAllUnAssignedInquiry.length);
            // console.log("userAssignedInquiry", userAssignedInquiry.length);
            // for (let index = 0; index < getAllUnAssignedInquiry.length; index++) {
            //     getAllUnAssignedInquiry[index]["assignedUser"] = getAllUnAssignedInquiry[index]["assignedUser"] !== null && getAllUnAssignedInquiry[index]["assignedUser"] !== undefined && getAllUnAssignedInquiry[index]["assignedUser"] !== "" ? getAllUnAssignedInquiry[index]["assignedUser"] : {};
            // }
            // const finalResponseArray = [...getAllUnAssignedInquiry, ...userAssignedInquiry];
            // const finalResponseArray = userAssignedInquiry;
            // const finalPaginationData = paginate(finalResponseArray, page, limit);
            // console.log("finalResponseArray", finalPaginationData.length);

            // const sortedItem = sortedItems(finalPaginationData.items);
           
            // const response = {
            //     docs: sortedItem,
            //     totalDocs: finalResponseArray.length,
            //     limit: parseInt(limit),
            //     page: parseInt(page),
            //     totalPages: finalPaginationData.totalPages,
            //     pagingCounter: "",
            //     "hasPrevPage": finalPaginationData.previousPage === null ? false : true,
            //     "hasNextPage": finalPaginationData.nextPage === null ? false : true,
            //     "prevPage": parseInt(finalPaginationData.previousPage),
            //     "nextPage": parseInt(finalPaginationData.nextPage)
            // }

            const getAllRecord = await db.getData({
                req: {
                    page: page || 1,
                    limit: limit || 10,
                    sort: "createdAt",
                    order: -1,
                    lean: true,
                    populate: [
                        {
                            "path": "assignedUser",
                            "select": "_id email fullName"
                        }
                    ]
                },
                model: models.PackageInquiry,
                query: assignedInquiryQuery,
            });
            return res.json({
                status: 200,
                success: true,
                data: getAllRecord,
                message: "Record(s) found successfully..",
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

exports.getAllPackageInquiry = async (req, res) => {
    const { search, page, limit, type, startDate, endDate } = req.query;
    const filter = search;
    const query = {};
    if (filter) {
        query["$or"] = [
            {
                fullName: { $regex: filter, $options: "i" },
            },
            {
                email: { $regex: filter, $options: "i" },
            },
            {
                travellingFrom: { $regex: filter, $options: "i" },
            },
            {
                refId: { $regex: filter, $options: "i" },
            },
        ];
    }
    if (type) {
        const ids = [];
        const getPackagesId = await models.PackageDetails.find({ forType: type }).select("_id");
        console.log("getPackagesId",getPackagesId);
        for (let index = 0; index < getPackagesId.length; index++) {
            ids.push(getPackagesId[index]._id);
            query["packageId"] = {
                $in: ids
            }

        }
    }

    if (startDate && endDate) {
        query["createdAt"] = {
            $gte: moment(startDate).startOf('day').toDate(),
            $lt: moment(endDate).endOf('day').toDate()
        }
    }

    const getRole = await RoleModel.findById(req.user.role);
    //console.log("getRole", getRole);
    if (getRole && getRole.name == "admin") {

    } else {
        // const getAssignedUserIquiry = await models.PackageInquiryAssignee.find({ userId: req.user._id }).select("inquiryId");
        // console.log("getAssignedUserIquiry", getAssignedUserIquiry.length);
        // const Ids = [];
        // for (let index = 0; index < getAssignedUserIquiry.length; index++) {
        //     Ids.push(getAssignedUserIquiry[index].inquiryId);
        // }
        // query["_id"] = { $in: Ids };
        // query["isAssignee"] = false;
        query["$or"] = [
            {
                "assignedUser": req.user._id
            },
            {

                "isAssignee": false,
            },
        ]
    }
    // console.log("query", JSON.stringify(query, null, 2));
    const getAllRecord = await db.getData({
        req: {
            page: page || 1,
            limit: limit || 10,
            populate: [
                {
                    "path": "packageId",
                },
                {
                    "path": "assignedUser",
                    "select": "_id email fullName"
                }
            ],
            sort: "createdAt",
            order: -1,
            lean: true
        },
        model: models.PackageInquiry,
        query: query,
    });
    // if (getAllRecord && getAllRecord.docs && getAllRecord.docs.length > 0) {
    //     for (let index = 0; index < getAllRecord.docs.length; index++) {
    //         const queryAssignee = {
    //             inquiryId: getAllRecord.docs[index]._id
    //         };
    //         const getRole = await RoleModel.findById(req.user.role);
    //         if (getRole && getRole.name == "admin") {

    //         } else {
    //             queryAssignee["userId"] = req.user._id
    //         }
    //         console.log("queryAssignee", queryAssignee);
    //         const getAssignedUser = await models.PackageInquiryAssignee.findOne(queryAssignee).sort({ createdAt: -1 });;
    //         if (getAssignedUser) {
    //             const getUser = await models.User.findOne({ _id: getAssignedUser.userId });
    //             getAllRecord.docs[index]["assignee"] = {
    //                 email: getUser?.email,
    //                 fullName: getUser?.fullName,
    //                 userId: getUser?._id,
    //             }
    //         } else {
    //             getAllRecord.docs[index]["assignee"] = {}
    //         }
    //     }
    // }
    // if (getAllRecord && getAllRecord.docs && getAllRecord.docs.length > 0) {
    //     for (let index = 0; index < getAllRecord.docs.length; index++) {
    //         getAllRecord.docs[index]["assignedUser"] = getAllRecord.docs[index]["assignedUser"] !== null ? getAllRecord.docs[index]["assignedUser"] : {};
    //     }
    // }
    return res.json({
        status: 200,
        success: true,
        data: getAllRecord,
        message: "Record(s) found successfully..",
    });
};

exports.updateInquiryStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, inquiryType, role } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "Status is required",
            });
        }
        if (!inquiryType) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "InquiryType is required (inquiryType = 1 for Direct Inquiry and 2 for PackageInquiry)",
            });
        }
        // inquiryType = 1 for Direct Inquiry and 2 for PackageInquiry
        if (inquiryType === 1) {
            console.log("Inquiry");
            const getRecord = await db.findById(id, models.Inquiry);
            if (!getRecord) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Inquiry Not Found By Provided Id",
                });
            }

            //const getAssignInquiry = await models.InquiryAssignee.findOne({ inquiryId: id });
            if (getRecord.isAssignee && getRecord.assignedUser) {
                //if (role.toLowerCase() === "admin") {
                    const updateRecord = await db.updateData(
                        id,
                        models.Inquiry,
                        { status: status }
                    );
                    return res.status(200).json({
                        success: true,
                        status: 200,
                        data: updateRecord,
                        message: "Record updated successfully.",
                    });
               // } else {
                  //  const getAssignInquiryToUser = await models.InquiryAssignee.findOne({ userId: req.user._id, inquiryId: id });
                    // if (getRecord.assignedUser) {
                    //     const updateRecord = await db.updateData(
                    //         id,
                    //         models.Inquiry,
                    //         { status: status }
                    //     );
                    //     return res.status(200).json({
                    //         success: true,
                    //         status: 200,
                    //         data: updateRecord,
                    //         message: "Record updated successfully.",
                    //     });
                    // } else {
                        // return res.status(400).json({
                        //     success: false,
                        //     status: 400,
                        //     data: null,
                        //     message: "Inquiry Not To LoggedIn User",
                        // });
                    //}
                //}
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Inquiry Not Assign to Any Users",
                });
            }
        } else if (inquiryType === 2) {
            console.log("Package Inquiry");
            const getRecord = await db.findById(id, models.PackageInquiry);
            if (!getRecord) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Package Inquiry Not Found By Provided Id",
                });
            }
            //const getAssignInquiry = await models.PackageInquiryAssignee.findOne({ inquiryId: id });
            if (getRecord.isAssignee && getRecord.assignedUser) {
               // if (role.toLowerCase() === "admin") {
                    const updateRecord = await db.updateData(
                        id,
                        models.PackageInquiry,
                        { status: status }
                    );
                    return res.status(200).json({
                        success: true,
                        status: 200,
                        data: updateRecord,
                        message: "Record updated successfully.",
                    });
               // } else {
                    //const getAssignInquiryToUser = await models.PackageInquiryAssignee.findOne({ userId: userId, inquiryId: id });
                //     if (getRecord.isAssignee && getRecord.assignedUser) {
                //         const updateRecord = await db.updateData(
                //             id,
                //             models.PackageInquiry,
                //             { status: status }
                //         );
                //         return res.status(200).json({
                //             success: true,
                //             status: 200,
                //             data: updateRecord,
                //             message: "Record updated successfully.",
                //         });
                //     } else {
                //         return res.status(400).json({
                //             success: false,
                //             status: 400,
                //             data: null,
                //             message: "Inquiry Not To LoggedIn TUser",
                //         });
                //     }
                // }
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Inquiry Not Assign to Any Users",
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: `Inquiry Type = ${inquiryType} not allowed. It's allowed only 1 and 2`,
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

exports.updateInquiryComments = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { comment, inquiryType } = req.body;
        if (!comment) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "Status is required",
            });
        }
        if (!inquiryType) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "InquiryType is required (inquiryType = 1 for Direct Inquiry and 2 for PackageInquiry)",
            });
        }
        // inquiryType = 1 for Direct Inquiry and 2 for PackageInquiry
        if (inquiryType === 1) {
            console.log("Inquiry");
            const getRecord = await db.findById(id, models.Inquiry);
            if (!getRecord) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Inquiry Not Found By Provided Id",
                });
            }
            const updateRecord = await db.updateData(
                id,
                models.Inquiry,
                { comment: comment }
            );
            return res.status(200).json({
                success: true,
                status: 200,
                data: updateRecord,
                message: "Record updated successfully.",
            });
        } else if (inquiryType === 2) {
            console.log("Package Inquiry");
            const getRecord = await db.findById(id, models.PackageInquiry);
            if (!getRecord) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Package Inquiry Not Found By Provided Id",
                });
            }
            const updateRecord = await db.updateData(
                id,
                models.PackageInquiry,
                { comment: comment }
            );
            return res.status(200).json({
                success: true,
                status: 200,
                data: updateRecord,
                message: "Record updated successfully.",
            });
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: `Inquiry Type = ${inquiryType} not allowed. It's allowed only 1 and 2`,
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

exports.deleteInquiry = async (req, res) => {
    try {
        const { id, type } = req.params;
        if (type === "Inquiry") {
            const getInquiryById = await models.Inquiry.findById(id);
            if (getInquiryById) {
                const deleteInquiry = await models.Inquiry.deleteOne({ _id: id });
                return res.status(200).json({
                    success: true,
                    status: 200,
                    data: deleteInquiry,
                    message: "Inquiry deleted successfully.",
                });
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    error: true,
                    message: "Invalid PackageId",
                });
            }
        } else if (type === "PackageInquiry") {
            const getPackageInquiryById = await models.PackageInquiry.findById(id);
            if (getPackageInquiryById) {
                const deleteInquiry = await models.PackageInquiry.deleteOne({ _id: id });
                return res.status(200).json({
                    success: true,
                    status: 200,
                    data: deleteInquiry,
                    message: "Inquiry deleted successfully.",
                });
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    error: true,
                    message: "Invalid PackageId",
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                error: true,
                message: "Invalid type, Type shuold be [Inquiry or PackageInquiry]",
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

exports.exportInquiry = async (req, res) => {
    try {
        const { type, startDate, endDate, typeOfInquiry } = req.body;
        if (!type) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "InquiryType is required (inquiryType = 1 for Direct Inquiry and 2 for PackageInquiry)",
            });
        }

        if (!startDate && !endDate) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "StartDate and EndDate is required.",
            });
        }

        if (!typeOfInquiry || typeOfInquiry.length < 0) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "Type Of Inquries required",
            });
        }

        const query = {};
        if (type === 1) {
            console.log("Inquiry");
            if (startDate && endDate) {
                query["type"] = {
                    $in: typeOfInquiry
                }
                query["createdAt"] = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lt: moment(endDate).endOf('day').toDate()
                }
            }
            console.log("query", query);
            let counter = 1;
            const getRecord = await models.Inquiry.find(query);
            if (getRecord && getRecord.length > 0) {
                const workbook = new excelJS.Workbook();  // Create a new workbook
                const worksheet = workbook.addWorksheet("Inquiry"); // New Worksheet
                // Column for data in excel. key must match data key
                worksheet.columns = [
                    { header: "No", key: "no", width: 10 },
                    { header: "Type", key: "type", width: 10 },
                    { header: "Full Name", key: "fullName", width: 10 },
                    { header: "Email", key: "email", width: 10 },
                    { header: "Mobile Number", key: "mobileNumber", width: 10 },
                    { header: "Created At", key: "createdAt", width: 10 },
                ];
                getRecord.forEach((inquiry) => {
                    const rowObject = {
                        no: counter,
                        type: inquiry.type,
                        fullName: inquiry.fullName,
                        email: inquiry.email,
                        mobileNumber: inquiry.mobileNumber,
                        createdAt: moment(inquiry.createdAt).format("LLLL")
                    };
                    worksheet.addRow(rowObject); // Add data in worksheet
                    counter++;
                });
                res.attachment(`${Date()}_inquiry.xlsx`);
                return workbook.xlsx.write(res);
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Inquiry not found",
                });
            }

        } else if (type === 2) {
            if (startDate && endDate) {
                query["type"] = {
                    $in: typeOfInquiry
                }
                query["createdAt"] = {
                    $gte: moment(startDate).startOf('day').toDate(),
                    $lt: moment(endDate).endOf('day').toDate()
                }
            }
            console.log("query", query);
            const getRecord = await models.PackageInquiry.find(query);
            if (getRecord && getRecord.length > 0) {
                const workbook = new excelJS.Workbook();  // Create a new workbook
                const worksheet = workbook.addWorksheet("Package Inquiry"); // New Worksheet
                // Column for data in excel. key must match data key
                worksheet.columns = [
                    { header: "No", key: "no", width: 10 },
                    { header: "Full Name", key: "fullName", width: 10 },
                    { header: "Email", key: "email", width: 10 },
                    { header: "Created At", key: "createdAt", width: 10 },
                ];
                let counter = 1;
                getRecord.forEach((inquiry) => {
                    const rowObject = {
                        no: counter,
                        fullName: inquiry.fullName,
                        email: inquiry.email,
                        createdAt: moment(inquiry.createdAt).format("LLLL")
                    };
                    worksheet.addRow(rowObject); // Add data in worksheet
                    counter++;
                });
                res.attachment(`${Date()}_package-inquiry.xlsx`);
                return workbook.xlsx.write(res);
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "Inquiry not found",
                });
            }

        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: `Inquiry Type = ${type} not allowed. It's allowed only 1 and 2`,
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

exports.assignInquiry = async (req, res) => {
    try {
        const { userId, inquiryId, inquiryType } = req.body;
        if (!userId || !inquiryId) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "userId and inquiryId are required",
            });
        }
        if (!inquiryType) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "InquiryType is required (inquiryType = 1 for Direct Inquiry and 2 for PackageInquiry)",
            });
        }
        const getRole = await RoleModel.findById(req.user.role);
        if (getRole && getRole.name == "admin") {
            if (inquiryType === 1) {
                const getRecord = await db.findById(inquiryId, models.Inquiry);
                if (!getRecord) {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        data: null,
                        message: "Inquiry Not Found By Provided Id",
                    });
                }

                // const checkInquiry = await models.InquiryAssignee.findOne({ userId: userId, inquiryId: inquiryId });
                // if (checkInquiry) {
                //     return res.status(400).json({
                //         success: false,
                //         status: 400,
                //         data: null,
                //         message: "Inquiry Already Assigneed To This User",
                //     });
                // } else {
                await models.Inquiry.updateOne({ _id: inquiryId }, { $set: { isAssignee: true, assignedUser: userId } }, { new: true });
                // req.body.assignedBy = req.user._id
                // const createAssignee = await db.create(req.body, models.InquiryAssignee);
                return res.status(200).json({
                    success: true,
                    satus: 200,
                    data: {},
                    message: "Inquiry Assigned Successfully."
                })
                // }
            } else if (inquiryType === 2) {
                const getRecord = await db.findById(inquiryId, models.PackageInquiry);
                if (!getRecord) {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        data: null,
                        message: "Inquiry Not Found By Provided Id",
                    });
                }

                // const checkInquiry = await models.PackageInquiryAssignee.findOne({ userId: userId, inquiryId: inquiryId });
                // if (checkInquiry) {
                //     return res.status(400).json({
                //         success: false,
                //         status: 400,
                //         data: null,
                //         message: "Inquiry Already Assigneed To This User",
                //     });
                // } else {
                await models.PackageInquiry.updateOne({ _id: inquiryId }, { $set: { isAssignee: true, assignedUser: userId } }, { new: true });
                // req.body.assignedBy = req.user._id
                // const createAssignee = await db.create(req.body, models.PackageInquiryAssignee);
                return res.status(200).json({
                    success: true,
                    satus: 200,
                    data: {},
                    message: "Inquiry Assigned Successfully."
                })
                // }
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: `Inquiry Type = ${inquiryType} not allowed. It's allowed only 1 and 2`,
                });
            }
        } else {
            console.log("req.user._id.toString()", req.user._id.toString());
            console.log("userId.toString()", userId.toString(), getRole);
            if (req.user._id.toString() === userId.toString()) {
                if (inquiryType === 1) {
                    const getRecord = await db.findById(inquiryId, models.Inquiry);
                    if (!getRecord) {
                        return res.status(400).json({
                            success: false,
                            status: 400,
                            data: null,
                            message: "Inquiry Not Found By Provided Id",
                        });
                    }
                    await models.Inquiry.updateOne({ _id: inquiryId }, { $set: { isAssignee: true, assignedUser: userId } }, { new: true });
                    req.body.assignedBy = req.user._id
                    // const createAssignee = await db.create(req.body, models.InquiryAssignee);
                    return res.status(200).json({
                        success: true,
                        satus: 200,
                        data: {},
                        message: "Inquiry Assigned Successfully."
                    })
                    // const checkInquiry = await models.InquiryAssignee.findOne({ userId: userId, inquiryId: inquiryId });
                    // if (checkInquiry) {
                    //     return res.status(400).json({
                    //         success: false,
                    //         status: 400,
                    //         data: null,
                    //         message: "Inquiry Already Assigneed To This User",
                    //     });
                    // } else {
                    //     await models.Inquiry.updateOne({ _id: inquiryId }, { $set: { isAssignee: true } });
                    //     req.body.assignedBy = req.user._id
                    //     const createAssignee = await db.create(req.body, models.InquiryAssignee);
                    //     return res.status(200).json({
                    //         success: true,
                    //         satus: 200,
                    //         data: createAssignee,
                    //         message: "Inquiry Assigned Successfully."
                    //     })
                    // }
                } else if (inquiryType === 2) {
                    const getRecord = await db.findById(inquiryId, models.PackageInquiry);
                    if (!getRecord) {
                        return res.status(400).json({
                            success: false,
                            status: 400,
                            data: null,
                            message: "Inquiry Not Found By Provided Id",
                        });
                    }
                    await models.PackageInquiry.updateOne({ _id: inquiryId }, { $set: { isAssignee: true, assignedUser: userId } }, { new: true });
                    // req.body.assignedBy = req.user._id
                    // const createAssignee = await db.create(req.body, models.PackageInquiryAssignee);
                    return res.status(200).json({
                        success: true,
                        satus: 200,
                        data: {},
                        message: "Inquiry Assigned Successfully."
                    });
                    // const checkInquiry = await models.PackageInquiryAssignee.findOne({ userId: userId, inquiryId: inquiryId });
                    // if (checkInquiry) {
                    //     return res.status(400).json({
                    //         success: false,
                    //         status: 400,
                    //         data: null,
                    //         message: "Inquiry Already Assigneed To This User",
                    //     });
                    // } else {
                    //     await models.PackageInquiry.updateOne({ _id: inquiryId }, { $set: { isAssignee: true, assignedUser: userId } }, { new: true });
                    //     req.body.assignedBy = req.user._id
                    //     const createAssignee = await db.create(req.body, models.PackageInquiryAssignee);
                    //     return res.status(200).json({
                    //         success: true,
                    //         satus: 200,
                    //         data: createAssignee,
                    //         message: "Inquiry Assigned Successfully."
                    //     })
                    // }
                } else {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        data: null,
                        message: `Inquiry Type = ${inquiryType} not allowed. It's allowed only 1 and 2`,
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    data: null,
                    message: "You can not assign inquiry to any other user",
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
}

exports.getAllInquiryAssignee = async (req, res) => {
    try {
        const { page, limit, inquiryType } = req.query;
        const query = {
            assignedBy: req.user._id
        }

        if (!inquiryType) {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: "InquiryType is required (inquiryType = 1 for Direct Inquiry and 2 for PackageInquiry)",
            });
        }

        if (parseInt(inquiryType) === 1) {
            const getAllRecord = await db.getData({
                req: {
                    page: page || 1,
                    limit: limit || 10,
                    sort: "createdAt",
                    order: -1,
                    populate: [{
                        path: "userId",
                        select: "_id email fullName"
                    },
                    {
                        path: "assignedBy",
                        select: "_id email fullName"
                    },
                    {
                        path: "inquiryId"
                    }
                    ],
                },
                model: models.InquiryAssignee,
                query: query,
            });
            return res.json({
                status: 200,
                success: true,
                data: getAllRecord,
                message: "Record(s) found successfully..",
            });
        } else if (parseInt(inquiryType) === 2) {
            const getAllRecord = await db.getData({
                req: {
                    page: page || 1,
                    limit: limit || 10,
                    sort: "createdAt",
                    order: -1,
                    populate: [{
                        path: "userId",
                        select: "_id email fullName"
                    },
                    {
                        path: "assignedBy",
                        select: "_id email fullName"
                    },
                    {
                        path: "inquiryId"
                    }
                    ],
                },
                model: models.PackageInquiryAssignee,
                query: query,
            });
            return res.json({
                status: 200,
                success: true,
                data: getAllRecord,
                message: "Record(s) found successfully..",
            });
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                data: null,
                message: `Inquiry Type = ${inquiryType} not allowed. It's allowed only 1 and 2`,
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

const paginate = (items, page = 1, perPage = 10) => {
    const offset = perPage * (page - 1);
    const totalPages = items.length / perPage;
    const paginatedItems = items.slice(offset, perPage * page);
    console.log("totalPages", totalPages);
    const finalTotalPages = Math.ceil(totalPages)
    return {
        previousPage: page - 1 ? page - 1 : null,
        nextPage: (finalTotalPages > page) ? parseInt(page) + parseInt(1) : null,
        total: items.length,
        totalPages: finalTotalPages,
        items: paginatedItems
    };
};

const sortedItems = (items) => {
    const arry = [];
    items.sort(function (a, b) {
        return moment(a.createdAt).toDate() - moment(b.createdAt).toDate()
    })

    console.log(items);
    return items;
}