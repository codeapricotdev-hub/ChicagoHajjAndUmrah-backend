const express = require("express");
const router = express.Router();
const upload = require("../../helpers/mobile/multer");
const mobileAuth = require("../../middleware/mobileAuth");
const applicationDocumentController = require("../../controllers/mobile/applicationDocumentV2");

router.post(
    "/upload",
    mobileAuth,
    upload.any(),
    applicationDocumentController.uploadDocuments
);
router.put(
    "/reupload",
    mobileAuth,
    upload.single("file"),
    applicationDocumentController.reuploadDocument
);
router.post(
    "/additional-requests/:requestId/upload",
    mobileAuth,
    upload.single("file"),
    applicationDocumentController.uploadAdditionalRequestedDocument
);
router.get(
    "/:documentId/download",
    mobileAuth,
    applicationDocumentController.downloadDocument
);
module.exports = router; // ✅ THIS IS CRITICAL
