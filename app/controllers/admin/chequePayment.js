const ChequePayment = require("../../models/mobile/chequePayment");

exports.createChequePayment = async (req, res) => {
    try {
        const { notes, nameOnCheque, importantNotes } = req.body;

        if (!notes || !nameOnCheque || !importantNotes) {
            return res.status(400).json({
                success: false,
                message: "Notes, name on cheque, and important notes are required",
            });
        }

        const record = await ChequePayment.create({
            notes,
            nameOnCheque,
            importantNotes,
        });

        return res.status(201).json({
            success: true,
            status: 201,
            data: record,
            message: "Cheque payment details created successfully",
        });
    } catch (error) {
        console.error("Create cheque payment error:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message || "Server error",
        });
    }
};

exports.getChequePayments = async (req, res) => {
    try {
        const list = await ChequePayment.find({}).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            status: 200,
            data: list,
            message: "Cheque payment details fetched successfully",
        });
    } catch (error) {
        console.error("Get cheque payments error:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message || "Server error",
        });
    }
};

exports.getChequePaymentById = async (req, res) => {
    try {
        const record = await ChequePayment.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Cheque payment details not found",
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            data: record,
            message: "Cheque payment details fetched successfully",
        });
    } catch (error) {
        console.error("Get cheque payment by id error:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message || "Server error",
        });
    }
};

exports.updateChequePayment = async (req, res) => {
    try {
        const { notes, nameOnCheque, importantNotes } = req.body;

        const record = await ChequePayment.findById(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Cheque payment details not found",
            });
        }

        if (notes !== undefined) record.notes = notes;
        if (nameOnCheque !== undefined) record.nameOnCheque = nameOnCheque;
        if (importantNotes !== undefined) record.importantNotes = importantNotes;

        if (!record.notes || !record.nameOnCheque || !record.importantNotes) {
            return res.status(400).json({
                success: false,
                message: "Notes, name on cheque, and important notes cannot be empty",
            });
        }

        await record.save();

        return res.status(200).json({
            success: true,
            status: 200,
            data: record,
            message: "Cheque payment details updated successfully",
        });
    } catch (error) {
        console.error("Update cheque payment error:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message || "Server error",
        });
    }
};

exports.deleteChequePayment = async (req, res) => {
    try {
        const record = await ChequePayment.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Cheque payment details not found",
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            data: record,
            message: "Cheque payment details deleted successfully",
        });
    } catch (error) {
        console.error("Delete cheque payment error:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message || "Server error",
        });
    }
};
