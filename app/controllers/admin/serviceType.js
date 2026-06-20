const ServiceType = require("../../models/mobile/serviceType");
const formidable = require("formidable");
const { uploadOnS3 } = require("../../helpers/s3");
const { parsePaginationParams, paginatedResponse } = require("../../helpers/pagination");
console.log("ServiceType schema paths:", Object.keys(ServiceType.schema.paths));
console.log("Model file location:", require.resolve("../../models/mobile/serviceType"));
exports.createServiceType = async (req, res) => {
    try {
        const form = new formidable.IncomingForm({ multiples: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            console.log("=== FORM PARSE ===");
            console.log("Fields keys:", Object.keys(fields));
            console.log("Files keys:", Object.keys(files));
            console.log("Files.images:", files.images)

            const {
                serviceId,
                title,
                description,
                price,
                processTime,
                eligibility,
                category,
                status,
                requirements,
                importantNotes,
            } = fields;

            if (!serviceId || !title || !price || !eligibility || !category) {
                return res.status(400).json({
                    success: false,
                    message: "Service, title and price are required",
                });
            }

            let imageUrls = [];
            if (files.images) {
                const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
                for (const file of imageFiles) {
                    const upload = await uploadOnS3(file.name, file.path, "service-types");
                    const imageUrl = upload.data;
                    imageUrls.push(imageUrl);
                }
            }

            console.log("imageUrls before create:", imageUrls);
            console.log("imageUrls length:", imageUrls.length);
            const serviceType = await ServiceType.create({
                serviceId,
                title,
                description,
                price,
                processTime,
                eligibility,
                category,
                status: status || "active",
                images: imageUrls,
                requirements,
                importantNotes,
            });
            console.log("Saved serviceType.images:", serviceType.images);

            return res.status(201).json({
                success: true,
                message: "Service type created successfully",
                data: serviceType,
            });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getServiceTypes = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaginationParams(req.query);

        const [data, total] = await Promise.all([
            ServiceType.find()
                .select('serviceId title description price processTime eligibility category status requirements importantNotes images createdAt')
                .populate("serviceId", "title")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ServiceType.countDocuments(),
        ]);

        res.json({
            success: true,
            data: paginatedResponse(data, page, limit, total),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getServiceTypeById = async (req, res) => {
    try {
        const data = await ServiceType.findById(req.params.id);
        if (!data) {
            return res.status(404).json({ success: false, message: "Not found" });
        }
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.updateServiceType = async (req, res) => {
    try {
        const form = new formidable.IncomingForm({ multiples: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message,
                });
            }

            try {
                const serviceType = await ServiceType.findById(req.params.id);

                if (!serviceType) {
                    return res.status(404).json({
                        success: false,
                        message: "Service Type not found",
                    });
                }

                // Update scalar fields
                Object.assign(serviceType, fields);

                // Handle existing images sent from frontend (kept URLs)
                let existingImages = [];
                if (fields.existingImages) {
                    existingImages = Array.isArray(fields.existingImages)
                        ? fields.existingImages
                        : [fields.existingImages];
                }

                // Upload new images and merge with kept existing ones
                // Upload new images
                let newImageUrls = [];

                if (files.images) {
                    const imageFiles = Array.isArray(files.images)
                        ? files.images
                        : [files.images];

                    for (const file of imageFiles) {
                        console.log("Uploading:", file);

                        const upload = await uploadOnS3(
                            file.name,
                            file.path,
                            "service-types"
                        );

                        console.log("Uploaded:", upload);
                        const imageUrl = upload.Location?.Location || upload.data;
                        newImageUrls.push(imageUrl);
                    }
                }

                // Merge kept + new
                serviceType.images = [...existingImages, ...newImageUrls];

                await serviceType.save();


                return res.json({
                    success: true,
                    message: "Service type updated successfully",
                    data: serviceType,
                });

            } catch (innerError) {
                return res.status(500).json({
                    success: false,
                    message: innerError.message,
                });
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



exports.deleteServiceType = async (req, res) => {
    try {
        await ServiceType.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


