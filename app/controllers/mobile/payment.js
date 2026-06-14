const { uploadToS3 } = require("../../helpers/mobile/s3");
const Stripe = require("stripe");
const Payment = require("../../models/mobile/payment");
const ZellePayment = require("../../models/mobile/zellePayment");
const ChequePayment = require("../../models/mobile/chequePayment");
const { createPaymentWithTransactionId } = require("../../helpers/mobile/paymentHelper");
const {
    buildStripeCheckoutMetadata,
    handleStripeWebhook,
} = require("../../helpers/mobile/stripeWebhookHandler");
const { notifyUserPaymentSubmitted } = require("../../helpers/mobile/userNotificationService");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// Generate Reference ID
const generateReferenceId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ZELLE-${timestamp}${random}`;
};
const stripHtml = (text = '') => text.replace(/<[^>]*>?/gm, '').trim();

/**
 * Create Stripe Checkout Session
 */

exports.createStripePayment = async (req, res) => {
    try {
        const { applicationId, amount } = req.body;

        const payment = await createPaymentWithTransactionId({
            userId: req.user._id,
            applicationId,
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

        res.json({
            success: true,
            checkoutUrl: session.url,
            data: {
                transactionId: payment.transactionId,
            },
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Stripe error" });
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
            depositDate
        } = req.body;

        const file = req.file;

        // ✅ Required fields
        if (!applicationId || !paymentMode || !amount) {
            return res.status(400).json({
                success: false,
                message: "applicationId, paymentMode and amount are required"
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Payment proof image is required"
            });
        }

        if (!["MANUAL_CHEQUE", "ZELLE"].includes(paymentMode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment mode"
            });
        }

        // ✅ Mode specific validation
        if (paymentMode === "MANUAL_CHEQUE") {
            if (!nameOnCheque || !depositDate) {
                return res.status(400).json({
                    success: false,
                    message: "Cheque details are required"
                });
            }
        }

        if (paymentMode === "ZELLE") {
            if (!referenceNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Zelle reference number is required"
                });
            }
        }

        // ✅ S3 Key Structure (Same pattern as document)
        const s3Key = `payments/${applicationId}/${paymentMode}_${Date.now()}`;

        const uploadResult = await uploadToS3(file, s3Key);

        const payment = await createPaymentWithTransactionId({
            userId: req.user._id,
            applicationId,
            paymentMode,
            amount,
            referenceNumber,
            proofUrl: uploadResult.url,
            proofS3Key: s3Key,
            status: "PENDING"
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

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.getPaymentsByUserId = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(userId);
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const payments = await Payment.find({ userId })
            .sort({ createdAt: -1 }); // latest first

        return res.status(200).json({
            success: true,
            message: "Payments fetched successfully",
            data: payments
        });

    } catch (error) {
        console.error("Error fetching payments:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

exports.getZellePaymentInstructions = async (req, res) => {
    try {
        const { price } = req.body;

        if (!price) {
            return res.status(400).json({
                success: false,
                message: "Price is required",
            });
        }

        // Get latest Zelle details
        const zelle = await ZellePayment.findOne().sort({ createdAt: -1 });

        if (!zelle) {
            return res.status(404).json({
                success: false,
                message: "Zelle payment details not found",
            });
        }

        const referenceId = generateReferenceId();

        // ✅ Dynamic Payment Instructions (template from DB)
        const defaultTemplate = `
 \r\n Send $${price} to:
- Email: ${zelle.email}
- Phone: ${zelle.phone}

 \r\n <b>Include the reference note</b>:
 "${referenceId} in the memo field".
        `.trim();

        const template = zelle?.instructionTemplate?.trim()
            ? zelle.instructionTemplate + ' ' + defaultTemplate
            : defaultTemplate;

        const templateText = stripHtml(template);

        return res.status(200).json({
            success: true,
            message: "Zelle payment instructions generated",
            data: {
                qrcode: zelle.qrcode,
                email: zelle.email,
                phone: zelle.phone,
                price,
                referenceId,
                templateText,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

exports.repayManualPayment = async (req, res) => {
    try {
        const {
            paymentId,
            referenceNumber,
            nameOnCheque,
            depositDate
        } = req.body;

        const file = req.file;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "paymentId is required"
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Payment proof image is required"
            });
        }

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        if (payment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!["MANUAL_CHEQUE", "ZELLE"].includes(payment.paymentMode)) {
            return res.status(400).json({
                success: false,
                message: "Only manual payments can be retried"
            });
        }

        if (!["FAILED", "REJECTED"].includes(payment.status)) {
            return res.status(400).json({
                success: false,
                message: "Only failed or rejected payments can be retried"
            });
        }

        if (payment.paymentMode === "MANUAL_CHEQUE") {
            if (!referenceNumber || !nameOnCheque || !depositDate) {
                return res.status(400).json({
                    success: false,
                    message: "Cheque details are required"
                });
            }
        }

        if (payment.paymentMode === "ZELLE") {
            if (!referenceNumber) {
                return res.status(400).json({
                    success: false,
                    message: "Zelle reference number is required"
                });
            }
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
            data: payment
        });

    } catch (error) {
        console.error("Repayment error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

exports.getChequePayments = async (req, res) => {
    try {

        const options = {
            sort: { createdAt: -1 }
        };

        const result = await ChequePayment.paginate({}, options);

        console.log(result)

        result.docs.forEach(data => {
            data.importantNotes = stripHtml(data.importantNotes);
        });
        console.log(result)
        return res.status(200).json({
            success: true,
            message: "Cheque payments fetched successfully",
            data: result
        });

    } catch (error) {
        console.error("Error fetching cheque payments:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};
