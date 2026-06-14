const mongoose = require("mongoose");
const Application = require("../../models/mobile/application");
const {
    isApplicationIdentifier,
    normalizeApplicationIdentifier,
} = require("./applicationIdentifier");

const buildApplicationLookupQuery = (reference, userId) => {
    const normalizedReference = reference?.toString().trim();

    if (!normalizedReference) {
        const error = new Error("Application reference is required");
        error.statusCode = 400;
        throw error;
    }

    const query = userId ? { userId } : {};

    if (mongoose.Types.ObjectId.isValid(normalizedReference)) {
        return {
            ...query,
            _id: normalizedReference,
        };
    }

    if (isApplicationIdentifier(normalizedReference)) {
        return {
            ...query,
            applicationIdentifier: normalizeApplicationIdentifier(normalizedReference),
        };
    }

    const error = new Error("Invalid application identifier");
    error.statusCode = 400;
    throw error;
};

const findApplicationByReference = (reference, userId) =>
    Application.findOne(buildApplicationLookupQuery(reference, userId));

module.exports = {
    buildApplicationLookupQuery,
    findApplicationByReference,
};
