const Application = require("../../models/mobile/application");
const ApplicantDetails = require("../../models/mobile/applicationDetails");
const {
    generateUniqueApplicationIdentifier,
} = require("../../helpers/mobile/applicationIdentifier");
const {
    findApplicationByReference,
} = require("../../helpers/mobile/applicationResolver");
const ApplicationStatusHistory = require("../../models/mobile/applicationStatusHistory");
const ApplicationDocument = require("../../models/mobile/applicationDocument");
const AdditionalDocumentRequest = require("../../models/mobile/additionalDocumentRequest");
const Payment = require("../../models/mobile/payment");
const {
    buildApplicationTrackingResponse,
} = require("../../helpers/mobile/applicationTrackingResponse");
const mapStatusLabel = (status) => {
    switch (status) {
        case "SUBMITTED":
            return "Application Submitted";
        case "UNDER_REVIEW":
            return "Document Review";
        case "PROCESSING":
            return "Visa Processing";
        case "APPROVED":
            return "Visa Approved";
        default:
            return status;
    }
};

const getStatusMessage = (status) => {
    switch (status) {
        case "APPROVED":
            return "Your visa has been approved!";
        case "PROCESSING":
            return "Your application is under processing";
        case "REJECTED":
            return "Your application was rejected";
        default:
            return "Application submitted successfully";
    }
};

const mapVisaDuration = (visaType) => {
    switch (visaType) {
        case "1_YEAR":
            return "1-Year Multiple Entry";
        case "30_DAYS":
            return "30 Days Single Entry";
        default:
            return visaType;
    }
};

const createApplication = async (req, res) => {
    try {
        const userId = req.user._id;
        const { visaType, applicants } = req.body;

        if (!visaType || !Array.isArray(applicants) || applicants.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Visa type and applicants are required",
            });
        }

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
        console.error("CREATE APPLICATION ERROR", error);

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate application identifier generated. Please retry.",
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

        // 1. Get all applications of user
        const applications = await Application.find({ userId })
            .sort({ createdAt: -1 })
            .lean();


        console.log(applications);

        if (!applications.length) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        const applicationIds = applications.map(app => app._id);

        // 2. Get successful payments only
        const payments = await Payment.aggregate([
            {
                $match: {
                    applicationId: { $in: applicationIds }
                },
            },
            {
                $group: {
                    _id: "$applicationId",
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        console.log(payments);
        // Convert to map for quick lookup
        const paymentMap = {};
        payments.forEach(p => {
            paymentMap[p._id.toString()] = p.totalAmount;
        });

        // 3. Get applicant count
        const applicants = await ApplicantDetails.aggregate([
            {
                $match: {
                    applicationId: { $in: applicationIds },
                },
            },
            {
                $group: {
                    _id: "$applicationId",
                    totalApplicants: { $sum: 1 },
                },
            },
        ]);

        console.log(applicants)
        const applicantMap = {};
        applicants.forEach(a => {
            applicantMap[a._id.toString()] = a.totalApplicants;
        });

        // 4. Merge + filter (ONLY applications with SUCCESS payment)
        const finalData = applications
            .filter(app => paymentMap[app._id.toString()]) // only paid apps
            .map(app => ({
                ...app,
                totalApplicants: applicantMap[app._id.toString()] || 0,
                totalAmount: paymentMap[app._id.toString()] || 0,
            }));

        console.log(finalData)
        return res.status(200).json({
            success: true,
            data: finalData,
        });

    } catch (error) {
        console.error("GET APPLICATIONS ERROR", error);
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

//         const application = await findApplicationByReference(id, userId);

//         if (!application) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Application not found",
//             });
//         }

//         const [applicants, documents, timeline, payment] = await Promise.all([
//             ApplicantDetails.find({
//                 applicationId: application._id,
//             }).sort({ createdAt: 1 }),
//             ApplicationDocument.find({
//                 applicationId: application._id,
//             })
//                 .select(
//                     "applicationId applicantId docType fileUrl status statusChangedAt reuploadReason isReupload version createdAt updatedAt"
//                 )
//                 .sort({ updatedAt: -1 }),
//             ApplicationStatusHistory.find({
//                 applicationId: application._id,
//             }).sort({ changedAt: -1 }),
//             Payment.findOne({ applicationId: application._id }).sort({ createdAt: -1 }),
//         ]);

//         const buildApplicationTrackingResponse = ({
//             application,
//             applicants,
//             documents,
//             statusHistory,
//             payment,
//         }) => {

//             // 🔹 STATUS
//             const status = {
//                 current: application.status,
//                 message: getStatusMessage(application.status),
//             };

//             // 🔹 SUMMARY
//             const summary = {
//                 visaType: application.visaType,
//                 visaDuration: mapVisaDuration(application.visaType),
//                 submittedDate: application.createdAt,
//                 totalApplicants: applicants.length,
//             };

//             // 🔹 TIMELINE
//             const timeline = statusHistory.map(item => ({
//                 status: mapStatusLabel(item.toStatus),
//                 date: item.changedAt,
//             }));

//             // 🔹 DOCUMENT HELPER
//             const getDocStatus = (doc) => {
//                 if (!doc) return "pending";
//                 if (doc.status === "APPROVED") return "done";
//                 if (doc.status === "REJECTED") return "reupload";
//                 return "pending";
//             };

//             // 🔹 APPLICANTS + DOCUMENTS
//             const applicantsAndDocuments = applicants.map(applicant => {

//                 const applicantDocs = documents.filter(
//                     d => d.applicantId.toString() === applicant._id.toString()
//                 );

//                 const findDoc = (type) =>
//                     applicantDocs.find(d => d.docType === type);

//                 return {
//                     _id: applicant._id,
//                     name: applicant.fullName,
//                     type: applicant.isAdult ? "adult" : "child",

//                     standardDocuments: [
//                         {
//                             type: "Photo ID",
//                             status: getDocStatus(findDoc("PHOTO")),
//                         },
//                         {
//                             type: "Passport",
//                             status: getDocStatus(findDoc("PASSPORT")),
//                         },
//                     ],

//                     additionalDocuments: [
//                         {
//                             type: "Marriage Certificate",
//                             status: getDocStatus(findDoc("MARRIAGE_CERT")),
//                         },
//                         {
//                             type: "Proof of Employment",
//                             status: getDocStatus(findDoc("EMPLOYMENT_PROOF")),
//                         },
//                     ],
//                 };
//             });

//             // 🔹 DOWNLOADS
//             const downloads = {
//                 visa: application.visaDoc || null,
//                 itinerary: application.itineraryDoc || null,
//                 insurance: application.insuranceDoc || null,
//             };

//             // 🔹 PAYMENT
//             const paymentData = payment
//                 ? {
//                     totalAmount: payment.amount,
//                     status: payment.status,
//                     method: payment.paymentMode,
//                     transactionId:
//                         payment.stripePaymentIntentId ||
//                         payment.referenceNumber ||
//                         null,
//                 }
//                 : {
//                     totalAmount: 0,
//                     status: "PENDING",
//                     method: null,
//                     transactionId: null,
//                 };

//             return {
//                 status,
//                 summary,
//                 timeline,
//                 applicantsAndDocuments,
//                 downloads,
//                 payment: paymentData,
//             };
//         };

//         return res.status(200).json({
//             success: true,
//             data: {
//                 application,
//                 applicants,
//                 documents,
//                 status: tracking.status,
//                 summary: tracking.summary,
//                 timeline: tracking.timeline,
//                 applicantsAndDocuments: tracking.applicantsAndDocuments,
//                 downloads: tracking.downloads,
//                 payment: tracking.payment,
//             },
//         });
//     } catch (error) {
//         console.error("GET APPLICATION BY ID ERROR", error);

//         if (error?.statusCode === 400) {
//             return res.status(400).json({
//                 success: false,
//                 message: error.message,
//             });
//         }

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

        console.log(application)

        const [applicants, documents, timelineRaw, payment, additionalDocumentRequests] = await Promise.all([
            ApplicantDetails.find({ applicationId: application._id }).sort({ createdAt: 1 }),

            ApplicationDocument.find({ applicationId: application._id })
                .select("applicationId applicantId docType displayName parentDocumentId additionalRequestId fileUrl status statusChangedAt rejectionReason reuploadReason isReupload version createdAt updatedAt")
                .sort({ updatedAt: -1 }),

            // ✅ FIXED (ascending)
            ApplicationStatusHistory.find({ applicationId: application._id })
                .populate("changedByAdminId", "fullName email")
                .populate("changedByUserId", "fullName email mobile")
                .sort({ changedAt: 1 }),

            Payment.findOne({ applicationId: application._id }).sort({ createdAt: -1 }),

            AdditionalDocumentRequest.find({
                applicationId: application._id,
                status: { $in: ["OPEN", "UPLOADED", "REJECTED"] },
            })
                .select("applicationId applicantId parentDocumentId title reason status uploadedDocumentId requestedAt uploadedAt resolvedAt createdAt updatedAt")
                .sort({ requestedAt: -1 }),
        ]);

        // ✅ CALL THE FUNCTION (YOU MISSED THIS)
        const tracking = buildApplicationTrackingResponse({
            application,
            applicants,
            documents,
            statusHistory: timelineRaw,
            payment,
        });

        console.log(tracking)

        return res.status(200).json({
            success: true,
            data: {
                ...tracking,
                additionalDocumentRequests,
            },
        });

    } catch (error) {
        console.error("GET APPLICATION BY ID ERROR", error);

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

const getApplicantsById = async (req, res) => {
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

        const applicants = await ApplicantDetails.find({
            applicationId: application._id,
        });

        return res.status(200).json({
            success: true,
            data: {
                applicationId: application._id,
                applicationIdentifier: application.applicationIdentifier,
                applicants,
            },
        });
    } catch (error) {
        console.error("GET APPLICANTS BY ID ERROR", error);

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

module.exports = {
    createApplication,
    getApplications,
    getApplicationById,
    getApplicantsById,
    getApplicationTimeline: async (req, res) => {
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

            const timeline = await ApplicationStatusHistory.find({
                applicationId: application._id,
            })
                .populate("changedByAdminId", "fullName email")
                .populate("changedByUserId", "fullName email mobile")
                .sort({ changedAt: -1 });

            return res.status(200).json({
                success: true,
                data: {
                    applicationId: application._id,
                    applicationIdentifier: application.applicationIdentifier,
                    currentStatus: application.status,
                    timeline,
                },
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    },
};
