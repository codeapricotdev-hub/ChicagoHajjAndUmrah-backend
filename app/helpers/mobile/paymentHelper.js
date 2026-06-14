const mongoose = require("mongoose");
const Payment = require("../../models/mobile/payment");
const Application = require("../../models/mobile/application");
const {
    generateUniqueTransactionId,
    isApplicationIdentifier,
    isTransactionIdentifier,
    normalizeApplicationIdentifier,
    normalizeTransactionIdentifier,
} = require("./applicationIdentifier");

const formatPaymentDetails = (payment, application = null) => ({
    transactionId: payment.transactionId || null,
    applicationId: payment.applicationId,
    applicationIdentifier: application?.applicationIdentifier || null,
    amount: payment.amount,
    paymentStatus: payment.status,
    paymentMethod: payment.paymentMode,
    createdAt: payment.createdAt,
});

const createPaymentWithTransactionId = async (paymentData) => {
    const { transactionId: _ignoredClientTransactionId, ...safePaymentData } =
        paymentData || {};
    const transactionId = await generateUniqueTransactionId(Payment);
    return Payment.create({
        ...safePaymentData,
        transactionId,
    });
};

const buildPaymentSearchQuery = async ({
    userId,
    transactionId,
    applicationId,
}) => {
    const query = {};

    if (userId) {
        query.userId = userId;
    }

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
        const applicationQuery = userId ? { userId } : {};

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

const findPaymentByReference = async (reference, userId) => {
    const normalizedReference = reference?.toString().trim();

    if (!normalizedReference) {
        const error = new Error("Payment reference is required");
        error.statusCode = 400;
        throw error;
    }

    const query = userId ? { userId } : {};

    if (mongoose.Types.ObjectId.isValid(normalizedReference)) {
        return Payment.findOne({ ...query, _id: normalizedReference });
    }

    if (isTransactionIdentifier(normalizedReference)) {
        return Payment.findOne({
            ...query,
            transactionId: normalizeTransactionIdentifier(normalizedReference),
        });
    }

    const error = new Error("Invalid payment reference");
    error.statusCode = 400;
    throw error;
};

module.exports = {
    buildPaymentSearchQuery,
    createPaymentWithTransactionId,
    findPaymentByReference,
    formatPaymentDetails,
};
