const Country = require('../../models/mobile/country');
const formidable = require('formidable');
const fs = require("fs");
const path = require("path");
const { parsePaginationParams, paginatedResponse } = require('../../helpers/pagination');

exports.addCountry = async (req, res) => {
    try {
        const { countryName, status } = req.body;

        if (!countryName) {
            return res.status(400).json({
                success: false,
                message: "Country name is required"
            });
        }

        const existing = await Country.findOne({ countryName });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Country already exists"
            });
        }

        const country = await Country.create({
            countryName,
            status
        });

        return res.status(201).json({
            success: true,
            data: country
        });
    } catch (error) {
        console.error("Add Country Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

/**
 * Update Country
 */
exports.updateCountry = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await Country.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Country not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error("Update Country Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

/**
 * Get All Countries
 */
exports.getCountries = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaginationParams(req.query);

        const [countries, total] = await Promise.all([
            Country.find().sort({ countryName: 1 }).skip(skip).limit(limit),
            Country.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            data: paginatedResponse(countries, page, limit, total),
        });
    } catch (error) {
        console.error("Get Countries Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

/**
 * Get Country By ID
 */
exports.getCountryById = async (req, res) => {
    try {
        const country = await Country.findById(req.params.id);

        if (!country) {
            return res.status(404).json({
                success: false,
                message: "Country not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: country
        });
    } catch (error) {
        console.error("Get Country Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

/**
 * Delete Country
 */
exports.deleteCountry = async (req, res) => {
    try {
        const deleted = await Country.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Country not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Country deleted successfully"
        });
    } catch (error) {
        console.error("Delete Country Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

