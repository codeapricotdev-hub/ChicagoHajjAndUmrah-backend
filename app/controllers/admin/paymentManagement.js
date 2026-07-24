const Payment = require("../../models/mobile/payment");
const Application = require("../../models/mobile/application");
const {
    isApplicationIdentifier,
    isTransactionIdentifier,
    normalizeApplicationIdentifier,
    normalizeTransactionIdentifier,
} = require("../../helpers/mobile/applicationIdentifier");
const { formatPaymentDetails } = require("../../helpers/mobile/paymentHelper");

const buildAdminPaymentQuery = async ({ transactionId, applicationId }) => {
    const query = {};

    if (transactionId) {
        const normalized = normalizeTransactionIdentifier(transactionId);
        if (!isTransactionIdentifier(normalized)) {
            const error = new Error("Invalid transaction ID format");
            error.statusCode = 400;
            throw error;
        }
        query.transactionId = normalized;
    }

    if (applicationId) {
        const normalizedReference = applicationId.toString().trim();
        const applicationQuery = { isCompleted: true };

        if (mongoose.Types.ObjectId.isValid(normalizedReference)) {
            applicationQuery._id = normalizedReference;
        } else if (isApplicationIdentifier(normalizedReference)) {
            applicationQuery.applicationIdentifier =
                normalizeApplicationIdentifier(normalizedReference);
        } else {
            const error = new Error("Invalid application identifier");
            error.statusCode = 400;
            throw error;
        }

        const application = await Application.findOne(applicationQuery).select("_id");

        if (!application) {
            return null;
        }

        query.applicationId = application._id;
    }

    return query;
};

exports.getPayments = async (req, res) => {
    try {
        const {
            transactionId,
            applicationId,
            page = 1,
            limit = 10,
        } = req.query;
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));

        const query = await buildAdminPaymentQuery({ transactionId, applicationId });

        if (query === null) {
            return res.status(200).json({
                success: true,
                data: {
                    list: [],
                    pagination: {
                        page: safePage,
                        limit: safeLimit,
                        total: 0,
                        totalPages: 0,
                    },
                },
            });
        }

        if (!query.applicationId) {
            const completedApps = await Application.find({ isCompleted: true }).select("_id").lean();
            query.applicationId = { $in: completedApps.map((app) => app._id) };
        }

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .sort({ createdAt: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .lean(),
            Payment.countDocuments(query),
        ]);

        const applicationIds = [
            ...new Set(payments.map((payment) => payment.applicationId?.toString()).filter(Boolean)),
        ];
        const applications = await Application.find({ _id: { $in: applicationIds }, isCompleted: true })
            .select("applicationIdentifier")
            .lean();
        const applicationMap = new Map(
            applications.map((application) => [application._id.toString(), application])
        );

        const list = payments.map((payment) =>
            formatPaymentDetails(
                payment,
                applicationMap.get(payment.applicationId?.toString()) || null
            )
        );

        return res.status(200).json({
            success: true,
            data: {
                list,
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    totalPages: Math.ceil(total / safeLimit),
                },
            },
        });
    } catch (error) {
        if (error?.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

exports.getPaymentByReference = async (req, res) => {
    try {
        const { reference } = req.params;
        let payment;

        if (isTransactionIdentifier(reference)) {
            payment = await Payment.findOne({
                transactionId: normalizeTransactionIdentifier(reference),
            });
        } else {
            payment = await Payment.findById(reference);
        }

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        const application = await Application.findOne({ _id: payment.applicationId, isCompleted: true }).select(
            "applicationIdentifier"
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: formatPaymentDetails(payment, application),
        });
    } catch (error) {
        if (error?.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};
