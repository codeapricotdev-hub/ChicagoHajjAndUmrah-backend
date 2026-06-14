const twilio = require("twilio");

let client = null;

if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE
) {
    client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
} else {
    console.warn("⚠️ Twilio not configured. SMS will be skipped.");
}


exports.sendOtpSms = async (to, otp) => {
    if (!client) {
        console.log(`📵 SMS skipped → OTP ${otp} for ${to}`);
        return { skipped: true };
    }

    return client.messages.create({
        body: `Your OTP is ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE,
        to
    });
};
