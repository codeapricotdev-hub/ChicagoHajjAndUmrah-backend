const ImageBanner = require('../../models/mobile/ImageBanner');
const formidable = require('formidable');
const { uploadOnS3 } = require('../../helpers/s3');
const { parsePaginationParams, paginatedResponse } = require('../../helpers/pagination');
const fs = require("fs");
const path = require("path");

exports.addImageBanner = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.log("Formidable error:", err.message);
                return res.status(500).json({
                    success: false,
                    message: err.message,
                });
            }

            const { imageTitle, status } = fields;
            const { image } = files;

            // ✅ Validation
            if (!imageTitle) {
                return res.status(400).json({
                    success: false,
                    message: "Image title is required",
                });
            }

            if (!image) {
                return res.status(400).json({
                    success: false,
                    message: "Banner image is required",
                });
            }

            // ✅ Upload to S3 (SAME AS SERVICE)
            const location = await uploadOnS3(
                image.name,
                image.path,
                "image-banners"
            );

            const banner = await ImageBanner.create({
                imageTitle,
                image: location.data, // ✅ S3 URL
                status: status || "active",
            });

            return res.status(201).json({
                success: true,
                data: banner,
                message: "Image banner created successfully",
            });
        });

    } catch (error) {
        console.log("Add image banner error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/* UPDATE IMAGE BANNER (S3) */
exports.updateImageBanner = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: "Error parsing form data",
                });
            }

            const banner = await ImageBanner.findById(req.params.id);
            if (!banner) {
                return res.status(404).json({
                    success: false,
                    message: "Image banner not found",
                });
            }

            const { imageTitle, status } = fields;
            const { image } = files;

            // ✅ Update title
            if (imageTitle) {
                banner.imageTitle = imageTitle;
            }

            // ✅ Update status
            if (status) {
                banner.status = status;
            }

            // ✅ Upload new image to S3 (if provided)
            if (image) {
                const location = await uploadOnS3(
                    image.originalFilename || image.name,
                    image.filepath || image.path,
                    "image-banners"
                );

                banner.image = location.data; // ✅ S3 URL
            }

            await banner.save();

            return res.json({
                success: true,
                data: banner,
                message: "Image banner updated successfully",
            });
        });
    } catch (error) {
        console.error("Update Image Banner Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/* GET BY ID */
exports.getImageBannerById = async (req, res) => {
    try {
        const banner = await ImageBanner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Image banner not found",
            });
        }

        res.json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};


/* LIST */
exports.getImageBanners = async (req, res) => {
    try {
        const { page, limit, skip } = parsePaginationParams(req.query);

        const [banners, total] = await Promise.all([
            ImageBanner.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            ImageBanner.countDocuments(),
        ]);

        res.json({
            success: true,
            data: paginatedResponse(banners, page, limit, total),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/* DELETE */
exports.deleteImageBanner = async (req, res) => {
    try {
        const banner = await ImageBanner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Image banner not found",
            });
        }

        // OPTIONAL: delete image from S3
        // await deleteFromS3(banner.image);

        await banner.deleteOne();

        res.json({
            success: true,
            message: "Image banner deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

