const Country = require('../../models/mobile/country');

/**
 * GET ALL ACTIVE COUNTRIES (FOR MOBILE APP)
 * Returns only active services with pagination
 * No authentication required
 */
exports.getCountries = async (req, res) => {
    try {

        // Only fetch active services for mobile
        const query = { status: 'active' };

        const [country, total] = await Promise.all([
            Country.find(query)
                .select('countryName countryCode status')
                .sort({ countryName: -1 })
                .lean(), // Use lean() for better performance
            Country.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            message: 'Coutries Banners fetched successfully',
            data: country,
        });

    } catch (error) {
        console.error('Mobile - Get Country error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch Country',
            error: error.message
        });
    }
};

/**
 * GET SERVICE BY ID (FOR MOBILE APP)
 * Returns single service details
 * No authentication required
 */
exports.getCountryById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID format'
            });
        }

        const country = await Country.findOne({
            _id: id,
            status: 'active' // Only return active services
        })
            .select('countryName countryCode status')
            .lean();

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found or inactive'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Country fetched successfully',
            data: country
        });

    } catch (error) {
        console.error('Mobile - Get service by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch service',
            error: error.message
        });
    }
};
