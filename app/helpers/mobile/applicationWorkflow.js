const WORKFLOW_SEQUENCE = [
    "PAYMENT_VERIFICATION",
    "UNDER_REVIEW",
    "PROCESSING",
    "VISA_ISSUED",
];

const LEGACY_STATUS_MAPPING = {
    SUBMITTED: "PAYMENT_VERIFICATION",
    REVIEW: "UNDER_REVIEW",
    PROCESSING: "PROCESSING",
    APPROVED: "VISA_ISSUED",
    REJECTED: "REJECTED",
    "APPLICATION SUBMITTED": "PAYMENT_VERIFICATION",
    "DOCUMENT REVIEW": "UNDER_REVIEW",
    "VISA PROCESSING": "PROCESSING",
    "VISA APPROVED": "VISA_ISSUED",
    "VISA REJECTED": "REJECTED",
};

const getCanonicalStatus = (status) => LEGACY_STATUS_MAPPING[status] || status;

const canTransitionStatus = (fromStatus, toStatus) => {
    const from = getCanonicalStatus(fromStatus);
    const to = getCanonicalStatus(toStatus);

    if (from === to) {
        return false;
    }

    if (from === "REJECTED") {
        return false;
    }

    const fromIndex = WORKFLOW_SEQUENCE.indexOf(from);
    const toIndex = WORKFLOW_SEQUENCE.indexOf(to);

    if (fromIndex === -1 || toIndex === -1) {
        return false;
    }

    return toIndex === fromIndex + 1;
};

module.exports = {
    WORKFLOW_SEQUENCE,
    LEGACY_STATUS_MAPPING,
    getCanonicalStatus,
    canTransitionStatus,
};
