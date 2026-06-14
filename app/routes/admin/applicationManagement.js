const express = require("express");
const passport = require("passport");
const upload = require("../../helpers/mobile/multer");
const controller = require("../../controllers/admin/applicationManagement");

const router = express.Router();

router.get("/", passport.authenticate("jwt", { session: false }), controller.getApplications);
router.get("/:id", passport.authenticate("jwt", { session: false }), controller.getApplicationById);
router.patch(
    "/:id/status",
    passport.authenticate("jwt", { session: false }),
    controller.updateApplicationStatus
);
router.patch(
    "/:id/payments/:paymentId/status",
    passport.authenticate("jwt", { session: false }),
    controller.updatePaymentStatus
);
router.get(
    "/:id/timeline",
    passport.authenticate("jwt", { session: false }),
    controller.getApplicationTimeline
);
router.get(
    "/:id/audit-logs",
    passport.authenticate("jwt", { session: false }),
    controller.getApplicationAuditLogs
);
router.post(
    "/:id/documents",
    passport.authenticate("jwt", { session: false }),
    upload.single("file"),
    controller.uploadAdminDocument
);
router.get(
    "/:id/documents/:documentId/download",
    passport.authenticate("jwt", { session: false }),
    controller.downloadDocument
);
router.patch(
    "/:id/documents/:documentId/status",
    passport.authenticate("jwt", { session: false }),
    controller.updateDocumentStatus
);
router.post(
    "/:id/documents/:documentId/reupload-request",
    passport.authenticate("jwt", { session: false }),
    controller.requestDocumentReupload
);
router.post(
    "/:id/documents/:documentId/additional-document-requests",
    passport.authenticate("jwt", { session: false }),
    controller.requestAdditionalDocument
);

module.exports = router;
