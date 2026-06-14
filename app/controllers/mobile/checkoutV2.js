const serviceType = require("../../models/mobile/serviceType");
const applicationDetails = require("../../models/mobile/applicationDetails");
const applicationDocument = require("../../models/mobile/applicationDocument");
const User = require("../../models/appUser");
const {
    findApplicationByReference,
} = require("../../helpers/mobile/applicationResolver");

exports.checkoutSummary = async (req, res) => {
    try {
        const { serviceId, applicationId, userId } = req.body;
        const resolvedUserId = req.user?._id || userId;

        if (!serviceId || !applicationId || !resolvedUserId) {
            return res.status(400).json({
                success: false,
                message: "serviceId, applicationId and userId are required",
            });
        }

        const serviceTypeDetails = await serviceType.findById(serviceId);

        if (!serviceTypeDetails) {
            return res.status(404).json({
                success: false,
                message: "Service type not found",
            });
        }

        const applicationDetail = await findApplicationByReference(
            applicationId,
            resolvedUserId
        );

        if (!applicationDetail) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        const applicants = await applicationDetails.find({
            applicationId: applicationDetail._id,
        });
        const applicantIds = applicants.map((applicant) => applicant._id);
        const documents = await applicationDocument.find({
            applicantId: { $in: applicantIds },
        });

        const applicantsWithDocs = applicants.map((applicant) => {
            const docs = documents.filter(
                (document) =>
                    document.applicantId.toString() === applicant._id.toString()
            );

            return {
                ...applicant.toObject(),
                documents: docs,
            };
        });

        const visaPrice = serviceTypeDetails.price || 0;
        const applicantCount = applicants.length;
        const totalDocuments = documents.length;
        const grossAmount = visaPrice * applicantCount;

        const applicantSummary = applicantsWithDocs.map((applicant) => ({
            applicantId: applicant._id,
            name: applicant.fullName,
            totalDocuments: applicant.documents.length,
        }));

        const user = await User.findById(resolvedUserId);

        return res.status(200).json({
            success: true,
            message: "Checkout details fetched successfully",
            data: {
                title: serviceTypeDetails.title,
                applicationId: applicationDetail._id,
                applicationIdentifier: applicationDetail.applicationIdentifier,
                totalApplicants: applicantCount,
                totalDocuments,
                applicants: applicantSummary,
                servicePrice: visaPrice,
                grossAmount,
                user: {
                    name: user.fullName,
                    email: user.email,
                    phone: user.mobile,
                },
            },
        });
    } catch (error) {
        console.error("CHECKOUT SUMMARY ERROR", error);

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
