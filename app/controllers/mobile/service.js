const Service = require('../../models/mobile/service');
const stripHtml = (text = '') => text.replace(/<[^>]*>?/gm, '').trim();
/**
 * GET ALL ACTIVE SERVICES (FOR MOBILE APP)
 * Returns only active services with pagination
 * No authentication required
 */
exports.getServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Only fetch active services for mobile
        const query = { status: 'active' };

        const [services, total] = await Promise.all([
            Service.find(query)
                .select('title description image status createdAt') // Only return needed fields
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // Use lean() for better performance
            Service.countDocuments(query)
        ]);
        services.forEach(service => {
            service.description = stripHtml(service.description);
        });
        return res.status(200).json({
            success: true,
            message: 'Services fetched successfully',
            data: services,
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
        console.error('Mobile - Get services error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch services',
            error: error.message
        });
    }
};

/**
 * GET SERVICE BY ID (FOR MOBILE APP)
 * Returns single service details
 * No authentication required
 */
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID format'
            });
        }

        const service = await Service.findOne({
            _id: id,
            status: 'active' // Only return active services
        })
            .select('title description image status createdAt updatedAt')
            .lean();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found or inactive'
            });
        }
        service.description = stripHtml(service.description);

        return res.status(200).json({
            success: true,
            message: 'Service fetched successfully',
            data: service
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

/**
 * SEARCH SERVICES (FOR MOBILE APP)
 * Search services by title or subtitle
 * No authentication required
 */
exports.searchServices = async (req, res) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Search in title and subtitle (case-insensitive)
        const searchQuery = {
            status: 'active',
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { subtitle: { $regex: query, $options: 'i' } }
            ]
        };

        const [services, total] = await Promise.all([
            Service.find(searchQuery)
                .select('title description image status createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Service.countDocuments(searchQuery)
        ]);

        return res.status(200).json({
            success: true,
            message: 'Search results fetched successfully',
            data: services,
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
        console.error('Mobile - Search services error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search services',
            error: error.message
        });
    }
};