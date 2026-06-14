const models = require("../../models").default;
const db = require("../../middleware/db");
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const Joi = require('joi');
const { INQUARY } = require("../../middleware/constant")
const s3 = require("../../helpers/uploadFiles3");
const smtp = require("../../helpers/mail");

exports.createInquary = async (req, res) => {
    try {
        const { type } = req.body;
        if (type == null) {
            return res.status(400).json({
                success: false,
                status: 400,
                error: true,
                message: "Type required",
            });
        }

        let createObject = {};
        let typeForMail;
        switch (type) {
            case "flight":
                createObject["type"] = req.body.type;
                createObject["fullName"] = req.body.fullName;
                createObject["email"] = req.body.email;
                createObject["mobileNumber"] = req.body.mobileNumber;
                createObject["tripType"] = req.body.tripType;
                createObject["from"] = req.body.from;
                createObject["to"] = req.body.to;
                createObject["departureDate"] = req.body.departureDate;
                createObject["returnDate"] = req.body.returnDate;
                createObject["noOfTravellerType"] = req.body.noOfTravellerType;
                createObject["travelClass"] = req.body.travelClass;
                createObject["isDateFixed"] = req.body.isDateFixed;
                createObject["isDateFlexible"] = req.body.isDateFlexible;
                typeForMail = "Flight";
                // const inquiryFlightSchema = Joi.object().keys({
                //     type: Joi.string().required(),
                //     fullName: Joi.string().required(),
                //     email: Joi.string().required(),
                //     mobileNumber: Joi.string().required(),
                //     tripType: Joi.string().required(),
                //     from: Joi.string().required(),
                //     to: Joi.string().required(),
                //     departureDate: Joi.string().required(),
                //     noOfTravellerType: Joi.array().required(),
                //     travelClass: Joi.string().required(),
                //     returnDate: Joi.string().allow("").optional(),
                // });
                // const flightResult = inquiryFlightSchema.validate(createObject);
                // if (flightResult && flightResult.error) {
                //     return res.status(400).json({
                //         status: 400,
                //         success: false,
                //         data: null,
                //         message: flightResult.error.details[0].message,
                //     })
                // }
                if (createObject["tripType"] === "multi_city") {
                    createObject["multiCity"] = req.body.multiCity
                }
                break;
            case "flightAndhotel":
                createObject["type"] = req.body.type;
                createObject["fullName"] = req.body.fullName;
                createObject["email"] = req.body.email;
                createObject["mobileNumber"] = req.body.mobileNumber;
                createObject["tripType"] = req.body.tripType;
                createObject["from"] = req.body.from;
                createObject["to"] = req.body.to;
                createObject["departureDate"] = req.body.departureDate;
                createObject["returnDate"] = req.body.returnDate;
                createObject["noOfTravellerType"] = req.body.noOfTravellerType;
                createObject["travelClass"] = req.body.travelClass;
                createObject["roomRating"] = req.body.roomRating;
                createObject["roomType"] = req.body.roomType;
                createObject["isDateFixed"] = req.body.isDateFixed;
                createObject["isDateFlexible"] = req.body.isDateFlexible;
                typeForMail = "Flight and hotel";
                // const inquiryFlightAndHotelSchema = Joi.object().keys({
                //     type: Joi.string().required(),
                //     fullName: Joi.string().required(),
                //     email: Joi.string().required(),
                //     mobileNumber: Joi.string().required(),
                //     tripType: Joi.string().required(),
                //     from: Joi.string().required(),
                //     to: Joi.string().required(),
                //     departureDate: Joi.string().required(),
                //     noOfTravellerType: Joi.array().required(),
                //     travelClass: Joi.string().required(),
                //     noOfRooms: Joi.number().required(),
                //     roomRating: Joi.string().required(),
                //     returnDate: Joi.string().allow("").optional(),
                // });
                // const flightAndHotelResult = inquiryFlightAndHotelSchema.validate(createObject);
                // if (flightAndHotelResult && flightAndHotelResult.error) {
                //     return res.status(400).json({
                //         status: 400,
                //         success: false,
                //         data: null,
                //         message: flightAndHotelResult.error.details[0].message,
                //     })
                // }

                if (createObject["tripType"] === "multi_city") {
                    createObject["multiCity"] = req.body.multiCity
                }
                break;
            case "HajjInquiry":
                createObject["type"] = req.body.type;
                createObject["fullName"] = req.body.fullName;
                createObject["email"] = req.body.email;
                createObject["mobileNumber"] = req.body.mobileNumber;
                createObject["totalTravellers"] = req.body.totalTravellers;
                typeForMail = "Hajj";
                break;
            case "umrahInquiry":
                createObject["type"] = req.body.type;
                createObject["fullName"] = req.body.fullName;
                createObject["email"] = req.body.email;
                createObject["mobileNumber"] = req.body.mobileNumber;
                createObject["totalTravellers"] = req.body.totalTravellers;
                createObject["extra_option"] = req.body.extra_option;
                typeForMail = "Umrah";
                break;
            case "tourInquiry":
                createObject["type"] = req.body.type;
                createObject["fullName"] = req.body.firstName + ' ' + req.body.lastName;
                createObject["firstName"] = req.body.firstName;
                createObject["lastName"] = req.body.lastName;
                createObject["email"] = req.body.email;
                createObject["mobileNumber"] = req.body.mobileNumber;
                createObject["totalTravellers"] = req.body.totalTravellers;
                createObject["destination"] = req.body.destination;
                createObject["roomRating"] = req.body.roomRating;
                createObject["comment"] = req.body.comment;
                typeForMail = "Tour";
                break;
            case "contactUs":
                    createObject["type"] = req.body.type;
                    createObject["fullName"] = req.body.fullName;
                    createObject["email"] = req.body.email;
                    createObject["mobileNumber"] = req.body.mobileNumber;
                    createObject["package"] = req.body.package;
                    createObject["message"] = req.body.message;
                    typeForMail = "Contact Us";
                    break;
        }

        let current_date=moment().tz('America/Chicago').format('DD-MM-YYYY HH:mm a').toString();

        createObject["refId"] = await makeid(5);
        const subject = `Inquiry for ${type}`;
        const context = {
            ...createObject,
            fullName: req.body.fullName ? req.body.fullName : req.body.firstName + ' ' + req.body.lastName,
            type: typeForMail,
            email: req.body.email,
            mobileNumber: req.body.mobileNumber,
            option: type === "umrahInquiry" && req.body.extra_option ? req.body.extra_option : "-",
            date:current_date,
            subject_for_user:`${typeForMail} Inquiry Confirmation`
        }

        const inquiry = await models.Inquiry.create(createObject);
        const sendEmail = await smtp.sendMailSendGrid(req.body.email, subject, "d-95df7309296941afb5a819f9982bdc28", context, createObject.refId);
        //console.log(sendEmail);
        // return res.json({
        //     status: 200,
        //     success: true,
        //     data: inquiry,
        //     message: "Record(s) created successfully..",
        // });
        if (sendEmail) {
            //const inquiry = await models.Inquiry.create(createObject);
            console.log(sendEmail);
            return res.json({
                status: 200,
                success: true,
                data: inquiry,
                message: "Record(s) created successfully..",
            });
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                error: true,
                message: "Something went wrong when sending email, Please try after sometimes",
            });
        }



    } catch (error) {
        console.log("error", error);
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
}

exports.eVisaInquiry = async (req, res) => {
    try {
        console.log("req.body", req.body);
        var form = new formidable.IncomingForm();
        form.multiples = true;
        // form.maxFileSize = 1000*1024*1024;
        form.parse(req, async function (err, fields, files) {
            const { fullName, email, mobileNumber, passportLength, otherNationalityPassportLength } = fields;
            // const { passport, otherNationalityPassport } = files;

            // const createObject = {
            //     fullName,
            //     email,
            //     mobileNumber,
            //     type: "evisa",
            // }
            let passportApplicants = []
            let applicantImageURL = [];
            // if (passportLength && passportLength > 0) {
            //     for (let index = 0; index < passportLength; index++) {
            //         if (files[`passport[${index}]`] && files[`passport[${index}]`].length > 0) {
            //             for (let indexPassport = 0; indexPassport < files[`passport[${index}]`].length; indexPassport++) {
            //                 const uploadLocation = await s3.uploadOnS3(files[`passport[${index}]`][indexPassport].name, files[`passport[${index}]`][indexPassport].path, 'inquiryEvisa');
            //                 applicantImageURL.push(uploadLocation.data)
            //             }
            //         }

            //         passportApplicants.push({
            //             [`applicant ${index + 1}`]: applicantImageURL
            //         });
            //         applicantImageURL = [];
            //     }
            // }

            if (passportLength && passportLength > 0) {
                for (let index = 0; index < passportLength; index++) {
                    // if (files[`passport[${index}]`] && files[`passport[${index}]`].length > 0) {
                    //     for (let indexPassport = 0; indexPassport < files[`passport[${index}]`].length; indexPassport++) {
                    //     }
                    // }
                    const passportUploadLocation = await s3.uploadOnS3(files[`us_ca_passport[${index}]`].name, files[`us_ca_passport[${index}]`].path, 'inquiryEvisa');
                    const photoLocation = await s3.uploadOnS3(files[`us_ca_photo[${index}]`].name, files[`us_ca_photo[${index}]`].path, 'inquiryEvisa');
                    applicantImageURL.push({
                        us_ca_passport: passportUploadLocation.data,
                        us_ca_photo: photoLocation.data
                    })

                    passportApplicants.push({
                        [`applicant ${index + 1}`]: applicantImageURL
                    });
                    applicantImageURL = [];
                }
            }

            let otherNationalityPassportApplicants = []
            let otherNationalityApplicantImageURL = [];
            // if (otherNationalityPassportLength && otherNationalityPassportLength > 0) {
            //     for (let index = 0; index < otherNationalityPassportLength; index++) {
            //         if (files[`otherNationalityPassport[${index}]`] && files[`otherNationalityPassport[${index}]`].length > 0) {
            //             for (let indexPassport = 0; indexPassport < files[`otherNationalityPassport[${index}]`].length; indexPassport++) {
            //                 const uploadLocation = await s3.uploadOnS3(files[`otherNationalityPassport[${index}]`][indexPassport].name, files[`otherNationalityPassport[${index}]`][indexPassport].path, 'inquiryEvisa');
            //                 otherNationalityApplicantImageURL.push(uploadLocation.data)
            //             }
            //         }

            //         otherNationalityPassportApplicants.push({
            //             [`applicant ${index + 1}`]: otherNationalityApplicantImageURL
            //         });
            //         otherNationalityApplicantImageURL = [];
            //     }
            // }

            if (otherNationalityPassportLength && otherNationalityPassportLength > 0) {
                for (let index = 0; index < otherNationalityPassportLength; index++) {
                    // if (files[`otherNationalityPassport[${index}]`] && files[`otherNationalityPassport[${index}]`].length > 0) {
                    //     for (let indexPassport = 0; indexPassport < files[`otherNationalityPassport[${index}]`].length; indexPassport++) {
                    //         const uploadLocation = await s3.uploadOnS3(files[`otherNationalityPassport[${index}]`][indexPassport].name, files[`otherNationalityPassport[${index}]`][indexPassport].path, 'inquiryEvisa');
                    //         otherNationalityApplicantImageURL.push(uploadLocation.data)
                    //     }
                    // }
                    const otherPassportLocation = await s3.uploadOnS3(files[`other_passport[${index}]`].name, files[`other_passport[${index}]`].path, 'inquiryEvisa');
                    const otherPhotoLocation = await s3.uploadOnS3(files[`other_photo[${index}]`].name, files[`other_photo[${index}]`].path, 'inquiryEvisa');
                    const otherGreenCardLocation = await s3.uploadOnS3(files[`other_green_card[${index}]`].name, files[`other_green_card[${index}]`].path, 'inquiryEvisa');
                    otherNationalityApplicantImageURL.push({
                        other_passport: otherPassportLocation.data,
                        other_photo: otherPhotoLocation.data,
                        other_green_card: otherGreenCardLocation.data
                    })
                    otherNationalityPassportApplicants.push({
                        [`applicant ${index + 1}`]: otherNationalityApplicantImageURL
                    });
                    otherNationalityApplicantImageURL = [];
                }
            }

            const subject = " E-Visa Inquiry Confirmation"
            const context = {
                fullName: fullName,
                type: "evisa",
                email: email,
                mobileNumber: mobileNumber
            }

            let current_date=moment().tz('America/Chicago').format('DD-MM-YYYY HH:mm a').toString();
            const createObject = {
                fullName,
                email,
                mobileNumber,
                type: "evisa",
                us_ca_passports: passportApplicants,
                other_passports: otherNationalityPassportApplicants,
                refId: await makeid(5),
                date:current_date
            }
            console.log("createObject", createObject);
            console.log("JOSN", JSON.stringify(createObject, null, 2));
            const inquiry = await models.Inquiry.create(createObject);
            const sendEmail = await smtp.sendMailSendGrid(email, subject, "d-95df7309296941afb5a819f9982bdc28", context, createObject.refId);
            console.log(sendEmail);
            return res.json({
                status: 200,
                success: true,
                data: inquiry,
                message: "Record(s) created successfully..",
            });
            if (sendEmail) {
                const inquiry = await models.Inquiry.create(createObject);

                return res.json({
                    status: 200,
                    success: true,
                    data: inquiry,
                    message: "Record(s) created successfully..",
                });
            } else {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    error: true,
                    message: "Something went wrong when sending email, Please try after sometimes",
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
}

exports.packageInquiry = async (req, res) => {
    try {
        if (!req.body.packageId) {
            return res.json({
                status: 400,
                success: false,
                data: null,
                message: "PackageId required.",
            });
        }
        const getPackage = await db.findById(req.body.packageId, models.PackageDetails);
        if (!getPackage) {
            return res.json({
                status: 400,
                success: false,
                data: null,
                message: "Invalid PackageId or Package not found with provided Id.",
            });
        }
        const subject = "Package Inquiry"
        let html = `<html><body><h3>Assalam O Alaikum ( السلام و عليكم و رحمة الله و بركاته )</h3><br><h3>${req.body.fullName} for your time to fill the form.</h3><br><h3><p>Your query has been received and will be attended shortly. Our staff will assist you for your trip step by step.</p></h3>`
        let packageType = "";
        switch (req.body.type) {
            case "Umrah":
                packageType = 'Umrah Package';
                break;
            case "Hajj":
                packageType = 'Hajj Package';
                break;
            case "Other":
                packageType = 'Other Package';
                break;
            default:
                packageType = "default";
                break;
        }

        let current_date=moment().tz('America/Chicago').format('DD-MM-YYYY HH:mm a').toString();

        const context = {
            fullName: req.body.fullName,
            type: packageType,
            email: req.body.email,
            mobileNumber: req.body.mobileNumber,
            date:current_date,
            subject_for_user:`${packageType} Confirmation`
        }
        req.body.refId = await makeid(5, "Package Inquiry");
        let reqbody = req.body;
        reqbody.phoneNumber = req.body.mobileNumber;
        //console.log(reqbody, context);
     
        
        const createPackageInquiry = await db.create(reqbody, models.PackageInquiry);
        const sendEmail = await smtp.sendMailSendGrid(req.body.email, subject, "d-95df7309296941afb5a819f9982bdc28", context, req.body.refId);

        console.log("sendEmail", sendEmail);
        return res.json({
            status: 200,
            success: true,
            data: createPackageInquiry,
            message: "Record(s) created successfully..",
        });
        if (sendEmail) {
            const createPackageInquiry = await db.create(req.body, models.PackageInquiry);
            return res.json({
                status: 200,
                success: true,
                data: createPackageInquiry,
                message: "Record(s) created successfully..",
            });
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                error: true,
                message: "Something went wrong when sending email, Please try after sometimes",
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

async function makeid(length, type) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    var findRecordFromRefId;
    if (type) {
        findRecordFromRefId = await models.PackageInquiry.findOne({ refId: result });
    } else {
        findRecordFromRefId = await models.Inquiry.findOne({ refId: result });
    }
    if (findRecordFromRefId) {
        console.log("findRecordFromRefId", findRecordFromRefId._id);
        makeid(5)
    } else {
        console.log("In MakeId Else");
        return result;
    }
}
