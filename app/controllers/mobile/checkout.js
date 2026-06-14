const serviceType = require("../../models/mobile/serviceType");
const application = require("../../models/mobile/application");
const applicationDetails = require("../../models/mobile/applicationDetails");
const applicationDocument = require("../../models/mobile/applicationDocument");
const User = require("../../models/appUser");

exports.checkoutSummary = async (req, res) => {
    try {

        const { serviceId, applicationId, userId } = req.body;

        if (!serviceId || !applicationId || !userId) {
            return res.status(400).json({
                success: false,
                message: "serviceId, applicationId and userId are required"
            });
        }

        // Fetch service type
        const serviceTypeDetails = await serviceType.findById(serviceId);

        if (!serviceTypeDetails) {
            return res.status(404).json({
                success: false,
                message: "Service type not found"
            });
        }

        // Fetch application
        const applicationDetail = await application.findById(applicationId);

        if (!applicationDetail) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Fetch applicants
        const applicants = await applicationDetails.find({ applicationId });

        const applicantIds = applicants.map(a => a._id);

        // Fetch documents
        const documents = await applicationDocument.find({
            applicantId: { $in: applicantIds }
        });

        // Attach documents to applicants
        const applicantsWithDocs = applicants.map(applicant => {
            const docs = documents.filter(
                d => d.applicantId.toString() === applicant._id.toString()
            );

            return {
                ...applicant.toObject(),
                documents: docs
            };
        });

        // Calculate totals
        const visaPrice = serviceTypeDetails.price || 0;
        const applicantCount = applicants.length;
        const totalVisaPrice = visaPrice * applicantCount;
        const grossAmount = totalVisaPrice;

        // Total documents
        const totalDocuments = documents.length;

        // Applicant summary
        const applicantSummary = applicantsWithDocs.map(a => ({
            applicantId: a._id,
            name: a.fullName,
            totalDocuments: a.documents.length
        }));

        // Fetch user
        const user = await User.findById(userId);

        return res.status(200).json({
            success: true,
            message: "Checkout details fetched successfully",
            data: {
                title: serviceTypeDetails.title,
                totalApplicants: applicantCount,
                totalDocuments: totalDocuments,
                applicants: applicantSummary,
                servicePrice: visaPrice,
                grossAmount: grossAmount,
                user: {
                    name: user.fullName,
                    email: user.email,
                    phone: user.mobile
                }
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};