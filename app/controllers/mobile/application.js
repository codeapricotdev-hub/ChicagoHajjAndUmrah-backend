const Application = require("../../models/mobile/application");
const ApplicantDetails = require("../../models/mobile/applicationDetails");
const ApplicationStatusHistory = require("../../models/mobile/applicationStatusHistory");
const {
    generateUniqueApplicationIdentifier,
} = require("../../helpers/mobile/applicationIdentifier");
const {
    findApplicationByReference,
} = require("../../helpers/mobile/applicationResolver");

const createApplication = async (req, res) => {
    try {
        console.log("REQ.USER 👉", req.user);
        console.log("REQ.BODY 👉", req.body);

        const userId = req.user._id;
        const { visaType, applicants } = req.body;


        if (!visaType || !applicants || !applicants.length) {
            return res.status(400).json({
                success: false,
                message: "Visa type and applicants are required",
            });
        }

        // 1️⃣ Create Application
        const applicationIdentifier = await generateUniqueApplicationIdentifier(
            Application
        );

        const application = await Application.create({
            userId,
            applicationIdentifier,
            visaType,
            status: "PAYMENT_VERIFICATION",
            statusChangedAt: new Date(),
        });

        // 2️⃣ Create Applicant Details
        const applicantDocs = applicants.map((applicant) => ({
            applicationId: application._id,
            fullName: applicant.fullName,
            isAdult: applicant.isAdult,
        }));

        await Promise.all([
            ApplicantDetails.insertMany(applicantDocs),
            ApplicationStatusHistory.create({
                applicationId: application._id,
                fromStatus: "DRAFT",
                toStatus: "PAYMENT_VERIFICATION",
                changedByUserId: userId,
                actorType: "APP_USER",
                note: "Application submitted and moved to payment verification.",
                changedAt: application.statusChangedAt || new Date(),
            }),
        ]);

        return res.status(201).json({
            success: true,
            message: "Application created successfully",
            applicationId: application._id,
            applicationIdentifier: application.applicationIdentifier,
            data: application,
        });
    } catch (error) {
        console.error(error);
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate application identifier generated. Please retry.",
            });
        }
        if (error?.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

const getApplications = async (req, res) => {
    try {
        const userId = req.user._id;

        const applications = await Application.find({ userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: applications,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// const getApplicationById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const userId = req.user._id;

//         // 🔐 Ensure user can access only their own application
//         const application = await findApplicationByReference(id, userId);

//         if (!application) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Application not found",
//             });
//         }

//         const applicants = await ApplicantDetails.find({
//             applicationId: application._id,
//         });

//         return res.status(200).json({
//             success: true,
//             data: {
//                 application,
//                 applicants,
//             },
//         });
//     } catch (error) {
//         console.error("GET APPLICATION BY ID ERROR 👉", error);
//         return res.status(500).json({
//             success: false,
//             message: "Server error",
//         });
//     }
// };
const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const application = await findApplicationByReference(id, userId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        const applicantsRaw = await ApplicantDetails.find({
            applicationId: application._id,
        });

        // 🧠 Transform applicants with documents
        const applicants = applicantsRaw.map(applicant => ({
            _id: applicant._id,
            name: applicant.fullName,
            type: applicant.type || "adult",
            documents: {
                standard: [
                    {
                        type: "Photo ID",
                        status: applicant.photoId ? "done" : "pending",
                    },
                    {
                        type: "Passport",
                        status: applicant.passport ? "done" : "pending",
                    }
                ],
                additional: [
                    {
                        type: "Marriage Certificate",
                        status: applicant.marriageCertificate ? "done" : "pending",
                    },
                    {
                        type: "Proof of Employment",
                        status: applicant.employmentProof ? "done" : "pending",
                    }
                ]
            }
        }));

        // 🧠 Timeline (Assuming you store logs)
        const timeline = application.statusLogs?.map(log => ({
            status: log.status,
            date: log.updatedAt
        })) || [];

        return res.status(200).json({
            success: true,
            data: {
                status: application.status,
                statusMessage: getStatusMessage(application.status),

                summary: {
                    visaType: application.visaType,
                    visaDuration: application.visaDuration,
                    submittedDate: application.createdAt,
                    totalApplicants: applicants.length
                },

                timeline,

                applicants,

                downloads: {
                    visa: application.visaDoc,
                    itinerary: application.itineraryDoc,
                    insurance: application.insuranceDoc
                },

                payment: {
                    totalAmount: application.amount,
                    status: application.paymentStatus,
                    method: application.paymentMethod,
                    transactionId: application.transactionId
                }
            }
        });

    } catch (error) {
        console.error("GET APPLICATION BY ID ERROR 👉", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

const getApplicantsById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // 🔐 Ensure user can access only their own application
        const application = await Application.findOne({
            _id: id,
            userId,
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        const applicants = await ApplicantDetails.find({
            applicationId: id,
        });

        return res.status(200).json({
            success: true,
            data: {
                applicants,
            },
        });
    } catch (error) {
        console.error("GET APPLICANTS BY ID ERROR 👉", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
module.exports = { createApplication, getApplications, getApplicationById, getApplicantsById };
