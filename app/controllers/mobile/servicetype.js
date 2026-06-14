const ServiceType = require('../../models/mobile/serviceType');
const Service = require('../../models/mobile/service');


const stripHtml = (text = '') => text.replace(/<[^>]*>?/gm, '').trim();
/**
 * GET ALL ACTIVE SERVICE TYPES (MOBILE)
 */
exports.getServiceTypes = async (req, res) => {
    try {
        const serviceTypes = await ServiceType.find({ status: 'active' })
            .select('serviceId title description price processTime eligibility category status requirements importantNotes images createdAt')
            .sort({ order: 1 })
            .lean();


        const formattedServices = serviceTypes.map(service => ({
            ...service,
            description: stripHtml(service.description),
            requirements: stripHtml(service.requirements),
            importantNotes: stripHtml(service.importantNotes)
        }));

        return res.status(200).json({
            success: true,
            data: formattedServices
        });

    } catch (error) {
        console.error('Mobile - Get service types error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch service types'
        });
    }
};



exports.getServiceTypeById = async (req, res) => {
    try {
        const serviceTypes = await ServiceType.find({ status: 'active' })
            .select('serviceId title description price processTime eligibility category status requirements importantNotes images createdAt')
            .sort({ order: 1 })
            .lean();


        const formattedServices = serviceTypes.map(service => ({
            ...service,
            description: stripHtml(service.description),
            requirements: stripHtml(service.requirements),
            importantNotes: stripHtml(service.importantNotes)
        }));

        return res.status(200).json({
            success: true,
            data: formattedServices
        });

    } catch (error) {
        console.error('Mobile - Get service types error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch service types'
        });
    }
};


/**
 * GET SERVICES BY SERVICE TYPE (MOBILE)
 */
exports.getServicesByType = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service type ID'
            });
        }

        const services = await Service.find({
            serviceTypeId: id,
            status: 'active'
        })
            .select('title description image status createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        services.description = stripHtml(services.description);

        return res.status(200).json({
            success: true,
            data: services
        });

    } catch (error) {
        console.error('Mobile - Get services by type error:', error);
        return res.status(500).json({
            success: fals9e,
            message: 'Failed to fetch services'
        });
    }
};



exports.getServiceTypeByServiceId = async (req, res) => {
    try {
        const { id: serviceId } = req.params;

        // Validate ObjectId format
        if (!serviceId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }

        const serviceTypes = await ServiceType.find({
            serviceId: serviceId,
            status: 'active'
        })
            .select('serviceId title description price processTime eligibility category status requirements importantNotes images createdAt')
            .lean();

        // ✅ Custom Sorting
        serviceTypes.sort((a, b) => {
            if (a.title.toLowerCase().includes('umrah')) return -1;
            if (b.title.toLowerCase().includes('umrah')) return 1;

            const numA = parseInt(a.title) || 0;
            const numB = parseInt(b.title) || 0;

            return numA - numB;
        });

        if (!serviceTypes.length) {
            return res.status(404).json({
                success: false,
                message: 'No service types found for this service'
            });
        }

        const formattedServices = serviceTypes.map(service => ({
            ...service,
            description: stripHtml(service.description),
            requirements: stripHtml(service.requirements),
            importantNotes: stripHtml(service.importantNotes)
        }));

        return res.status(200).json({
            success: true,
            data: formattedServices
        });

    } catch (error) {
        console.error('Mobile - Get service type by service ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch service types'
        });
    }
};