const Stripe = require("stripe");
const Payment = require("../../models/mobile/payment");
const {
    notifyPaymentStatusChange,
    notifyUserPaymentSubmitted,
} = require("./userNotificationService");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getWebhookSecret = () =>
    process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SIGNING_SECRET;

const findPaymentFromSession = async (session) => {
    const paymentId = session?.metadata?.paymentId;
    if (paymentId) {
        const payment = await Payment.findById(paymentId);
        if (payment) {
            return payment;
        }
    }

    const transactionId = session?.metadata?.transactionId;
    if (transactionId) {
        const payment = await Payment.findOne({ transactionId });
        if (payment) {
            return payment;
        }
    }

    if (session?.id) {
        return Payment.findOne({ stripeSessionId: session.id });
    }

    return null;
};

const findPaymentFromPaymentIntent = async (paymentIntent) => {
    const paymentId = paymentIntent?.metadata?.paymentId;
    if (paymentId) {
        const payment = await Payment.findById(paymentId);
        if (payment) {
            return payment;
        }
    }

    const transactionId = paymentIntent?.metadata?.transactionId;
    if (transactionId) {
        const payment = await Payment.findOne({ transactionId });
        if (payment) {
            return payment;
        }
    }

    if (paymentIntent?.id) {
        return Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    }

    return null;
};

const applyPaymentStatusUpdate = async (payment, nextStatus, extraFields = {}) => {
    if (!payment) {
        return { skipped: true, reason: "Payment not found" };
    }

    if (payment.status === nextStatus) {
        return { skipped: true, reason: "Payment status unchanged" };
    }

    const previousStatus = payment.status;

    if (nextStatus === "FAILED" && previousStatus === "SUCCESS") {
        return { skipped: true, reason: "Successful payment cannot be marked failed" };
    }

    payment.status = nextStatus;

    if (extraFields.stripePaymentIntentId) {
        payment.stripePaymentIntentId = extraFields.stripePaymentIntentId;
    }

    if (extraFields.stripePaymentMethod) {
        payment.stripePaymentMethod = extraFields.stripePaymentMethod;
    }

    await payment.save();

    const pushResult = await notifyPaymentStatusChange(payment, previousStatus);

    return { updated: true, pushResult };
};

const handleCheckoutSessionCompleted = async (session) => {
    const payment = await findPaymentFromSession(session);
    if (!payment) {
        return { skipped: true, reason: "Payment not found" };
    }

    const submissionResult = await notifyUserPaymentSubmitted(payment);

    if (session.payment_status !== "paid") {
        return {
            submissionNotified: submissionResult,
            skipped: true,
            reason: "Checkout completed without paid status",
        };
    }

    const updateResult = await applyPaymentStatusUpdate(payment, "SUCCESS", {
        stripePaymentIntentId: session.payment_intent,
        stripePaymentMethod: session.payment_method_types?.[0],
    });

    return { submissionNotified: submissionResult, ...updateResult };
};

const handleCheckoutSessionAsyncPaymentSucceeded = async (session) => {
    const payment = await findPaymentFromSession(session);
    return applyPaymentStatusUpdate(payment, "SUCCESS", {
        stripePaymentIntentId: session.payment_intent,
        stripePaymentMethod: session.payment_method_types?.[0],
    });
};

const handleCheckoutSessionFailed = async (session) => {
    const payment = await findPaymentFromSession(session);

    if (!payment || payment.status !== "PENDING") {
        return { skipped: true, reason: "No pending payment to mark failed" };
    }

    return applyPaymentStatusUpdate(payment, "FAILED");
};

const handlePaymentIntentFailed = async (paymentIntent) => {
    const payment = await findPaymentFromPaymentIntent(paymentIntent);

    if (!payment || !["PENDING", "FAILED"].includes(payment.status)) {
        return { skipped: true, reason: "No pending payment to mark failed" };
    }

    return applyPaymentStatusUpdate(payment, "FAILED", {
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentMethod: paymentIntent.payment_method_types?.[0],
    });
};

const handleStripeEvent = async (event) => {
    switch (event.type) {
        case "checkout.session.completed":
            return handleCheckoutSessionCompleted(event.data.object);
        case "checkout.session.async_payment_succeeded":
            return handleCheckoutSessionAsyncPaymentSucceeded(event.data.object);
        case "checkout.session.async_payment_failed":
        case "checkout.session.expired":
            return handleCheckoutSessionFailed(event.data.object);
        case "payment_intent.payment_failed":
            return handlePaymentIntentFailed(event.data.object);
        default:
            return { skipped: true, reason: `Unhandled event type: ${event.type}` };
    }
};

exports.handleStripeWebhook = async (req, res) => {
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured");
        return res.status(500).send("Webhook secret is not configured");
    }

    const signature = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        console.error("Stripe webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        const result = await handleStripeEvent(event);
        console.log(`Stripe webhook ${event.type}:`, result);
        return res.json({ received: true, result });
    } catch (error) {
        console.error("Stripe webhook handler error:", error);
        return res.status(500).send("Webhook handler failed");
    }
};

exports.buildStripeCheckoutMetadata = (payment) => ({
    paymentId: String(payment._id),
    transactionId: payment.transactionId || "",
});
