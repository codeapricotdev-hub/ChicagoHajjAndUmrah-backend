const formidable = require("formidable");
const validator = require("validator");
const ZellePayment = require("../../models/mobile/zellePayment");
const { uploadOnS3 } = require("../../helpers/s3");

const extractFile = (file) => {
    if (!file) return null;
    if (Array.isArray(file)) return file[0];
    return file;
};

const normalizePhone = (phone) =>
    (phone || "").toString().replace(/\D/g, "");

const isValidPhone = (phone) => /^\d{10}$/.test(phone);

const normalizeInstructionTemplate = (value) => {
    if (value === undefined) return undefined;
    return (value || "").toString().trim();
};

exports.createZellePayment = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    status: 500,
                    error: true,
                    message: err.message,
                });
            }

            try {
                const email = (fields.email || "")
                    .toString()
                    .trim()
                    .toLowerCase();
                const phone = normalizePhone(fields.phone);
                const instructionTemplate =
                    normalizeInstructionTemplate(fields.instructionTemplate);

                const qrcode = extractFile(files.qrcode);

                if (!qrcode) {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        message: "QR code image is required",
                    });
                }

                if (!email || !validator.isEmail(email)) {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        message: "Valid email is required",
                    });
                }

                if (!phone || !isValidPhone(phone)) {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        message: "Valid 10-digit phone number is required",
                    });
                }

                const uploaded = await uploadOnS3(
                    qrcode.originalFilename || qrcode.name,
                    qrcode.filepath || qrcode.path,
                    "zelle-payments"
                );

                const createObject = {
                    qrcode: uploaded.data,
                    email,
                    phone,
                };

                if (instructionTemplate !== undefined) {
                    createObject.instructionTemplate = instructionTemplate;
                }

                const payment = await ZellePayment.create(createObject);

                return res.status(201).json({
                    success: true,
                    status: 201,
                    data: payment,
                    message: "Zelle payment created successfully",
                });
            } catch (error) {
                return res.status(error.code ? error.code : 500).json({
                    success: false,
                    status: error.code ? error.code : 500,
                    error: true,
                    message: error.message,
                });
            }
        });

        form.on("error", (error) => {
            return res.status(500).json({
                success: false,
                status: 500,
                error: true,
                message: error.message,
            });
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};

exports.getZellePayments = async (req, res) => {
    try {
        const payments = await ZellePayment.find({})
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            status: 200,
            data: payments,
            message: "Zelle payments fetched successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            error: true,
            message: error.message,
        });
    }
};

exports.getZellePaymentById = async (req, res) => {
    try {
        const payment = await ZellePayment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Zelle payment not found",
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            data: payment,
            message: "Zelle payment fetched successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            error: true,
            message: error.message,
        });
    }
};

exports.updateZellePayment = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    status: 500,
                    error: true,
                    message: err.message,
                });
            }

            try {
                const payment = await ZellePayment.findById(req.params.id);
                if (!payment) {
                    return res.status(404).json({
                        success: false,
                        status: 404,
                        message: "Zelle payment not found",
                    });
                }

                if (fields.email !== undefined) {
                    const email = (fields.email || "")
                        .toString()
                        .trim()
                        .toLowerCase();
                    if (!email || !validator.isEmail(email)) {
                        return res.status(400).json({
                            success: false,
                            status: 400,
                            message: "Valid email is required",
                        });
                    }
                    payment.email = email;
                }

                if (fields.phone !== undefined) {
                    const phone = normalizePhone(fields.phone);
                    if (!phone || !isValidPhone(phone)) {
                        return res.status(400).json({
                            success: false,
                            status: 400,
                            message: "Valid 10-digit phone number is required",
                        });
                    }
                    payment.phone = phone;
                }

                if (Object.prototype.hasOwnProperty.call(fields, "instructionTemplate")) {
                    const instructionTemplate = normalizeInstructionTemplate(fields.instructionTemplate);
                    payment.instructionTemplate = instructionTemplate;
                }

                const qrcode = extractFile(files.qrcode);
                if (qrcode) {
                    const uploaded = await uploadOnS3(
                        qrcode.originalFilename || qrcode.name,
                        qrcode.filepath || qrcode.path,
                        "zelle-payments"
                    );
                    payment.qrcode = uploaded.data;
                }

                await payment.save();

                return res.status(200).json({
                    success: true,
                    status: 200,
                    data: payment,
                    message: "Zelle payment updated successfully",
                });
            } catch (error) {
                return res.status(error.code ? error.code : 500).json({
                    success: false,
                    status: error.code ? error.code : 500,
                    error: true,
                    message: error.message,
                });
            }
        });

        form.on("error", (error) => {
            return res.status(500).json({
                success: false,
                status: 500,
                error: true,
                message: error.message,
            });
        });
    } catch (error) {
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};

exports.deleteZellePayment = async (req, res) => {
    try {
        const payment = await ZellePayment.findByIdAndDelete(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Zelle payment not found",
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            data: payment,
            message: "Zelle payment deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            error: true,
            message: error.message,
        });
    }
};

