const Service = require('../../models/mobile/service');
const formidable = require('formidable');
const { uploadOnS3 } = require('../../helpers/s3');
const { parsePaginationParams, paginatedResponse } = require('../../helpers/pagination');

exports.createService = async (req, res) => {
    try {
        var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            if (err) {
                console.log("Formidable error:", err.message);
                return res.status(500).json({
                    success: false,
                    status: 500,
                    error: true,
                    message: err.message,
                });
            }

            const { title, description, status } = fields;
            const { image } = files;

            try {
                // Validate required fields
                if (!title || !description) {
                    return res.status(400).json({
                        success: false,
                        message: 'Title and description are required'
                    });
                }

                if (!image) {
                    return res.status(400).json({
                        success: false,
                        message: 'Service image is required'
                    });
                }

                const createObject = {
                    title,
                    description,
                    status: status || 'active'  // ✅ CORRECT - string, defaults to 'active'
                };
                console.log(createObject)
                // Upload image to S3
                const location = await uploadOnS3(image.name, image.path, "services");
                createObject["image"] = location.data;

                // Create service record
                const service = await Service.create(createObject);

                return res.status(201).json({
                    success: true,
                    status: 201,
                    data: service,
                    message: "Service created successfully",
                });

            } catch (error) {
                console.log('Create service error:', error.message);
                return res.status(error.code ? error.code : 500).json({
                    success: false,
                    status: error.code ? error.code : 500,
                    error: true,
                    message: error.message,
                });
            }
        });

        form.on("error", function (err) {
            console.log("Form error:", err.message);
            return res.status(500).json({
                success: false,
                status: 500,
                error: true,
                message: err.message,
            });
        });

    } catch (error) {
        console.log('Outer error:', error.message);
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};

exports.getServices = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaginationParams(req.query);

        const [services, total] = await Promise.all([
            Service.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Service.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            data: paginatedResponse(services, page, limit, total),
        });
    } catch (error) {
        console.error("Get services error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params._id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: service
        });

    } catch (error) {
        console.error('Get service by ID error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateService = async (req, res) => {
    try {
        var form = new formidable.IncomingForm();
        form.parse(req, async function (err, fields, files) {
            if (err) {
                console.log("Formidable error:", err.message);
                return res.status(500).json({
                    success: false,
                    status: 500,
                    error: true,
                    message: err.message,
                });
            }

            const { title, description, status } = fields;
            const { image } = files;

            try {
                const service = await Service.findById(req.params._id);

                if (!service) {
                    return res.status(404).json({
                        success: false,
                        message: 'Service not found'
                    });
                }

                // Update fields
                if (title) service.title = title;
                if (description) service.description = description;
                if (status) service.status = status;

                // Upload new image if provided
                if (image) {
                    const location = await uploadOnS3(image.name, image.path, "services");
                    service.image = location.data;
                }

                await service.save();

                return res.status(200).json({
                    success: true,
                    status: 200,
                    data: service,
                    message: "Service updated successfully",
                });

            } catch (error) {
                console.log('Update service error:', error.message);
                return res.status(error.code ? error.code : 500).json({
                    success: false,
                    status: error.code ? error.code : 500,
                    error: true,
                    message: error.message,
                });
            }
        });

        form.on("error", function (err) {
            console.log("Form error:", err.message);
            return res.status(500).json({
                success: false,
                status: 500,
                error: true,
                message: err.message,
            });
        });

    } catch (error) {
        console.log('Outer error:', error.message);
        return res.status(error.code ? error.code : 500).json({
            success: false,
            status: error.code ? error.code : 500,
            error: true,
            message: error.message,
        });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params._id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Service deleted successfully'
        });

    } catch (error) {
        console.error('Delete service error:', error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};