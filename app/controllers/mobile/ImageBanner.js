const ImageBanner = require('../../models/mobile/ImageBanner');

/**
 * GET ALL ACTIVE SERVICES (FOR MOBILE APP)
 * Returns only active services with pagination
 * No authentication required
 */
exports.getImageBanner = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Only fetch active services for mobile
        const query = { status: 'active' };

        const [imagebanner, total] = await Promise.all([
            ImageBanner.find(query)
                .select('title image status ') // Only return needed fields
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // Use lean() for better performance
            ImageBanner.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            message: 'Image Banners fetched successfully',
            data: imagebanner,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.error('Mobile - Get image banner error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch Image Banner',
            error: error.message
        });
    }
};

/**
 * GET SERVICE BY ID (FOR MOBILE APP)
 * Returns single service details
 * No authentication required
 */
exports.getImageBannerById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID format'
            });
        }

        const imagebanner = await ImageBanner.findOne({
            _id: id,
            status: 'active' // Only return active services
        })
            .select('title image status createdAt updatedAt')
            .lean();

        if (!imagebanner) {
            return res.status(404).json({
                success: false,
                message: 'Image Banner not found or inactive'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Image Banner fetched successfully',
            data: imagebanner
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
