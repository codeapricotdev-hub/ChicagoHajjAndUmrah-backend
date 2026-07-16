const twilio = require("twilio");

const trimEnv = (value) =>
    typeof value === "string" ? value.trim() : value;

const digitsOnly = (phone) => String(phone || "").replace(/\D/g, "");

/**
 * Normalize phone numbers into Twilio-compatible E.164 format.
 * Examples:
 *   "+91 9712885335" → "+919712885335"
 *   "5551234567"     → "+15551234567"
 */
const normalizePhoneForTwilio = (phone) => {
    const trimmed = trimEnv(phone);
    if (!trimmed) return trimmed;

    const digits = digitsOnly(trimmed);
    if (!digits) return trimmed;

    if (trimmed.startsWith("+")) {
        return `+${digits}`;
    }

    if (digits.length === 10) {
        return `+1${digits}`;
    }

    if (digits.length === 11 && digits.startsWith("1")) {
        return `+${digits}`;
    }

    return `+${digits}`;
};

const getMobileLookupVariants = (phone) => {
    if (!phone) return [];

    const variants = new Set();
    const trimmed = trimEnv(phone);
    const digits = digitsOnly(trimmed);
    const e164 = normalizePhoneForTwilio(trimmed);

    if (trimmed) variants.add(trimmed);
    if (digits) variants.add(digits);
    if (e164) variants.add(e164);

    if (digits.length === 10) {
        variants.add(`+1${digits}`);
        variants.add(`1${digits}`);
    }

    if (digits.length === 11 && digits.startsWith("1")) {
        variants.add(`+${digits}`);
        variants.add(digits.slice(1));
    }

    if (digits.length > 10 && !digits.startsWith("1")) {
        variants.add(`+${digits}`);
    }

    return [...variants].filter(Boolean);
};

let twilioClient = null;

const getTwilioConfig = () => {
    const accountSid =
        trimEnv(process.env.TWILIO_ACCOUNT_SID) ||
        trimEnv(process.env.TWILIO_SID);
    const authToken = trimEnv(process.env.TWILIO_AUTH_TOKEN);
    const fromPhone = trimEnv(process.env.TWILIO_PHONE);

    if (!accountSid || !authToken || !fromPhone) {
        return null;
    }

    if (!twilioClient) {
        twilioClient = twilio(accountSid, authToken);
    }

    return { client: twilioClient, fromPhone };
};

exports.isSmsConfigured = () => Boolean(getTwilioConfig());

exports.sendOtpSms = async (to, otp) => {
    const config = getTwilioConfig();
    if (!config) {
        // Twilio disabled / missing credentials — do not fail callers.
        console.log(`SMS skipped (Twilio not configured) → OTP for ${to}`);
        return { skipped: true };
    }

    const toNumber = normalizePhoneForTwilio(to);

    try {
        const message = await config.client.messages.create({
            body: `Your OTP is ${otp}. Valid for 5 minutes.`,
            from: config.fromPhone,
            to: toNumber,
        });

        console.log(`SMS OTP sent to ${toNumber}, sid=${message.sid}`);
        return message;
    } catch (error) {
        const twilioMessage =
            error?.message ||
            error?.moreInfo ||
            "Failed to send SMS";

        console.error("Twilio SMS Error:", {
            code: error?.code,
            status: error?.status,
            message: twilioMessage,
            to: toNumber,
        });

        const smsError = new Error(twilioMessage);
        smsError.code = error?.code;
        smsError.status = error?.status;
        throw smsError;
    }
};

exports.normalizePhoneForTwilio = normalizePhoneForTwilio;
exports.getMobileLookupVariants = getMobileLookupVariants;
