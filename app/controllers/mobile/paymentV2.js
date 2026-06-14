const { uploadToS3 } = require("../../helpers/mobile/s3");
const Stripe = require("stripe");
const Payment = require("../../models/mobile/payment");
const Application = require("../../models/mobile/application");
const ApplicationStatusHistory = require("../../models/mobile/applicationStatusHistory");
const ZellePayment = require("../../models/mobile/zellePayment");
const ChequePayment = require("../../models/mobile/chequePayment");
const {
    findApplicationByReference,
} = require("../../helpers/mobile/applicationResolver");
const {
    buildPaymentSearchQuery,
    createPaymentWithTransactionId,
    findPaymentByReference,
    formatPaymentDetails,
} = require("../../helpers/mobile/paymentHelper");
const {
    buildStripeCheckoutMetadata,
    handleStripeWebhook,
} = require("../../helpers/mobile/stripeWebhookHandler");
const { notifyUserPaymentSubmitted } = require("../../helpers/mobile/userNotificationService");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const generateReferenceId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ZELLE-${timestamp}${random}`;
};

const stripHtml = (text = "") => text.replace(/<[^>]*>?/gm, "").trim();

const ensurePaymentVerificationTimeline = async (application, userId) => {
    const existingHistory = await ApplicationStatusHistory.findOne({
        applicationId: application._id,
        toStatus: "PAYMENT_VERIFICATION",
    }).select("_id");

    const updates = {};
    if (application.status === "SUBMITTED" || application.status === "APPLICATION SUBMITTED") {
        updates.status = "PAYMENT_VERIFICATION";
        updates.statusChangedAt = application.statusChangedAt || application.createdAt || new Date();
    }

    if (Object.keys(updates).length) {
        await Application.updateOne({ _id: application._id }, { $set: updates });
        Object.assign(application, updates);
    }

    if (!existingHistory) {
        await ApplicationStatusHistory.create({
            applicationId: application._id,
            fromStatus: "DRAFT",
            toStatus: "PAYMENT_VERIFICATION",
            changedByUserId: userId,
            actorType: "APP_USER",
            note: "Application submitted and moved to payment verification.",
            changedAt: application.statusChangedAt || application.createdAt || new Date(),
        });
    }
};

exports.createStripePayment = async (req, res) => {
    try {
        const { applicationId, amount } = req.body;

        const application = await findApplicationByReference(
            applicationId,
            req.user._id
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        await ensurePaymentVerificationTimeline(application, req.user._id);

        const payment = await createPaymentWithTransactionId({
            userId: req.user._id,
            applicationId: application._id,
            paymentMode: "STRIPE",
            amount,
            currency: "usd",
            status: "PENDING",
        });

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            currency: "usd",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Visa Application Fees",
                        },
                        unit_amount: amount * 100,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/payment-success`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
            metadata: buildStripeCheckoutMetadata(payment),
        });

        payment.stripeSessionId = session.id;
        await payment.save();

        return res.json({
            success: true,
            checkoutUrl: session.url,
            data: {
                transactionId: payment.transactionId,
            },
        });
    } catch (error) {
        console.error("CREATE STRIPE PAYMENT ERROR", error);

        if (error?.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({ message: "Stripe error" });
    }
};

exports.stripeWebhook = handleStripeWebhook;

exports.createManualPayment = async (req, res) => {
    try {
        const {
            applicationId,
            paymentMode,
            amount,
            referenceNumber,
            nameOnCheque,
            depositDate,
        } = req.body;
        const file = req.file;

        if (!applicationId || !paymentMode || !amount) {
            return res.status(400).json({
                success: false,
                message: "applicationId, paymentMode and amount are required",
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Payment proof image is required",
            });
        }

        if (!["MANUAL_CHEQUE", "ZELLE"].includes(paymentMode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment mode",
            });
        }

        if (paymentMode === "MANUAL_CHEQUE" && (!nameOnCheque || !depositDate)) {
            return res.status(400).json({
                success: false,
                message: "Cheque details are required",
            });
        }

        if (paymentMode === "ZELLE" && !referenceNumber) {
            return res.status(400).json({
                success: false,
                message: "Zelle reference number is required",
            });
        }

        const application = await findApplicationByReference(
            applicationId,
            req.user._id
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }

        await ensurePaymentVerificationTimeline(application, req.user._id);

        const s3Key = `payments/${application._id}/${paymentMode}_${Date.now()}`;
        const uploadResult = await uploadToS3(file, s3Key);

        const payment = await createPaymentWithTransactionId({
            userId: req.user._id,
            applicationId: application._id,
            paymentMode,
            amount,
            referenceNumber,
            proofUrl: uploadResult.url,
            proofS3Key: s3Key,
            status: "PENDING",
            nameOnCheque,
            depositDate,
        });

        await notifyUserPaymentSubmitted(payment);

        return res.status(201).json({
            success: true,
            message: "Payment submitted successfully. Awaiting admin approval.",
            data: {
                transactionId: payment.transactionId,
                payment,
            },
        });
    } catch (error) {
        console.error("CREATE MANUAL PAYMENT ERROR", error);

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

exports.getPaymentsByUserId = async (req, res) => {
    try {
        const userId = req.user._id;
        const { transactionId, applicationId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const query = await buildPaymentSearchQuery({
            userId,
            transactionId,
            applicationId,
        });

        if (query === null) {
            return res.status(200).json({
                success: true,
                message: "Payments fetched successfully",
                data: [],
            });
        }

        const payments = await Payment.find(query)
            .populate("applicationId", "applicationIdentifier")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Payments fetched successfully",
            data: payments,
        });
    } catch (error) {
        console.error("GET PAYMENTS ERROR", error);

        if (error?.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

exports.getPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const payment = await findPaymentByReference(reference, req.user._id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        const application = await Application.findById(payment.applicationId).select(
            "applicationIdentifier"
        );

        return res.status(200).json({
            success: true,
            data: formatPaymentDetails(payment, application),
        });
    } catch (error) {
        console.error("GET PAYMENT ERROR", error);

        if (error?.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

exports.getZellePaymentInstructions = async (req, res) => {
    try {
        const { price, refid } = req.body;

        if (!price) {
            return res.status(400).json({
                success: false,
                message: "Price is required",
            });
        }

        const zelle = await ZellePayment.findOne().sort({ createdAt: -1 });

        if (!zelle) {
            return res.status(404).json({
                success: false,
                message: "Zelle payment details not found",
            });
        }

        //const referenceId = generateReferenceId();
        const defaultTemplate = `
 \r\n Send $${price} to:
- Email: ${zelle.email}
- Phone: ${zelle.phone}

 \r\n <b>Include the reference note</b>:
 "${refid} in the memo field".
        `.trim();

        const template = zelle?.instructionTemplate?.trim()
            ? `${zelle.instructionTemplate} ${defaultTemplate}`
            : defaultTemplate;

        return res.status(200).json({
            success: true,
            message: "Zelle payment instructions generated",
            data: {
                qrcode: zelle.qrcode,
                email: zelle.email,
                phone: zelle.phone,
                price,
                refid,
                templateText: stripHtml(template),
            },
        });
    } catch (error) {
        console.error("GET ZELLE PAYMENT INSTRUCTIONS ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.repayManualPayment = async (req, res) => {
    try {
        const { paymentId, referenceNumber, nameOnCheque, depositDate } = req.body;
        const file = req.file;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "paymentId is required",
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Payment proof image is required",
            });
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        if (payment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!["MANUAL_CHEQUE", "ZELLE"].includes(payment.paymentMode)) {
            return res.status(400).json({
                success: false,
                message: "Only manual payments can be retried",
            });
        }

        if (!["FAILED", "REJECTED"].includes(payment.status)) {
            return res.status(400).json({
                success: false,
                message: "Only failed or rejected payments can be retried",
            });
        }

        if (
            payment.paymentMode === "MANUAL_CHEQUE" &&
            (!referenceNumber || !nameOnCheque || !depositDate)
        ) {
            return res.status(400).json({
                success: false,
                message: "Cheque details are required",
            });
        }

        if (payment.paymentMode === "ZELLE" && !referenceNumber) {
            return res.status(400).json({
                success: false,
                message: "Zelle reference number is required",
            });
        }

        const s3Key = `payments/${payment.applicationId}/RETRY_${payment.paymentMode}_${Date.now()}`;
        const uploadResult = await uploadToS3(file, s3Key);

        payment.proofUrl = uploadResult.url;
        payment.proofS3Key = s3Key;
        payment.referenceNumber = referenceNumber;

        if (payment.paymentMode === "MANUAL_CHEQUE") {
            payment.nameOnCheque = nameOnCheque;
            payment.depositDate = depositDate;
        }

        payment.status = "PENDING";
        payment.adminRemark = null;
        payment.isReupload = false;

        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment resubmitted successfully",
            data: payment,
        });
    } catch (error) {
        console.error("REPAY MANUAL PAYMENT ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

exports.getChequePayments = async (req, res) => {
    try {
        const options = {
            sort: { createdAt: -1 },
        };

        const result = await ChequePayment.paginate({}, options);

        result.docs.forEach((data) => {
            data.importantNotes = stripHtml(data.importantNotes);
        });

        return res.status(200).json({
            success: true,
            message: "Cheque payments fetched successfully",
            data: result,
        });
    } catch (error) {
        console.error("GET CHEQUE PAYMENTS ERROR", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};
