const mongoose = require("mongoose");
const models = require("../../models").default;
const db = require("../../middleware/db");

// 1. createInquiry()
exports.createInquiry = async (req, res) => {
    try {
        const {
            full_name,
            nationality,
            country_of_residence,
            passport_validity,
            traveling_as,
            umrah_before,
            travel_month,
            phone_number,
            email,
            notes
        } = req.body;

        // Validation
        const requiredFields = [
            'full_name',
            'nationality',
            'country_of_residence',
            'passport_validity',
            'traveling_as',
            'umrah_before',
            'travel_month',
            'phone_number',
            'email'
        ];

        for (const field of requiredFields) {
            if (!req.body[field] || String(req.body[field]).trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: `${field.replace(/_/g, ' ')} is required.`
                });
            }
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPhoneNumber = String(phone_number).trim();
        const normalizedTravelingAs = String(traveling_as).trim();
        const normalizedUmrahBefore = String(umrah_before).trim();

        if (!/^\+\d+/.test(normalizedPhoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must include country code (e.g. +15551234567)."
            });
        }

        if (!['Individual', 'Family', 'Group'].includes(normalizedTravelingAs)) {
            return res.status(400).json({
                success: false,
                message: "traveling_as must be one of: Individual, Family, Group."
            });
        }

        if (!['Yes', 'No'].includes(normalizedUmrahBefore)) {
            return res.status(400).json({
                success: false,
                message: "umrah_before must be one of: Yes, No."
            });
        }

        const inquiryData = {
            full_name: String(full_name).trim(),
            nationality: String(nationality).trim(),
            country_of_residence: String(country_of_residence).trim(),
            passport_validity: String(passport_validity).trim(),
            traveling_as: normalizedTravelingAs,
            umrah_before: normalizedUmrahBefore,
            travel_month: String(travel_month).trim(),
            phone_number: normalizedPhoneNumber,
            email: normalizedEmail,
            notes: notes ? String(notes).trim() : ""
        };

        const newInquiry = await models.MobileInquiry.create(inquiryData);

        return res.status(201).json({
            success: true,
            message: "Inquiry submitted successfully.",
            data: newInquiry
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 2. getAllInquiries()
exports.getAllInquiries = async (req, res) => {
    try {
        const { search, page, limit, sort = "createdAt", order = -1 } = req.query;

        const query = {};

        if (search) {
            const searchVal = String(search).trim();
            query.$or = [
                { full_name: { $regex: searchVal, $options: "i" } },
                { email: { $regex: searchVal, $options: "i" } },
                { phone_number: { $regex: searchVal, $options: "i" } }
            ];
        }

        // Use the db helper getData for pagination
        const paginatedResult = await db.getData({
            req: {
                page: parseInt(page, 10) || 1,
                limit: parseInt(limit, 10) || 10,
                sort: sort,
                order: parseInt(order, 10) || -1,
                lean: true
            },
            model: models.MobileInquiry,
            query: query
        });

        return res.status(200).json({
            success: true,
            message: "Mobile inquiries fetched successfully.",
            data: paginatedResult.docs,
            pagination: {
                total: paginatedResult.totalDocs,
                page: paginatedResult.page,
                limit: paginatedResult.limit,
                totalPages: paginatedResult.totalPages
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 3. getInquiryById()
exports.getInquiryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Inquiry ID."
            });
        }

        const inquiry = await models.MobileInquiry.findById(id).lean();

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                message: "Inquiry not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Mobile inquiry fetched successfully.",
            data: inquiry
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 4. deleteInquiry()
exports.deleteInquiry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Inquiry ID."
            });
        }

        const deletedInquiry = await models.MobileInquiry.findByIdAndDelete(id);

        if (!deletedInquiry) {
            return res.status(404).json({
                success: false,
                message: "Inquiry not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Inquiry deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
