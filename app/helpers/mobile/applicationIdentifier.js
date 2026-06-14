const APPLICATION_PREFIX = "APP";
const TRANSACTION_PREFIX = "TXN";

const APPLICATION_IDENTIFIER_REGEX = /^APP-\d{6}-\d{6}$/;
const TRANSACTION_IDENTIFIER_REGEX = /^TXN-\d{6}-\d{6}$/;

const padNumber = (value, size) => value.toString().padStart(size, "0");

const normalizeApplicationIdentifier = (value = "") =>
    value.toString().trim().toUpperCase();

const normalizeTransactionIdentifier = (value = "") =>
    value.toString().trim().toUpperCase();

const isApplicationIdentifier = (value = "") =>
    APPLICATION_IDENTIFIER_REGEX.test(normalizeApplicationIdentifier(value));

const isTransactionIdentifier = (value = "") =>
    TRANSACTION_IDENTIFIER_REGEX.test(normalizeTransactionIdentifier(value));

const generateIdentifierCandidate = (prefix) => {
    const now = new Date();
    const datePart = [
        now.getUTCFullYear().toString().slice(-2),
        padNumber(now.getUTCMonth() + 1, 2),
        padNumber(now.getUTCDate(), 2),
    ].join("");
    const randomPart = padNumber(Math.floor(Math.random() * 1000000), 6);

    return `${prefix}-${datePart}-${randomPart}`;
};

const generateApplicationIdentifierCandidate = () =>
    generateIdentifierCandidate(APPLICATION_PREFIX);

const generateUniqueIdentifier = async (
    Model,
    fieldName,
    prefix,
    maxAttempts = 10
) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const candidate = generateIdentifierCandidate(prefix);
        const existingRecord = await Model.exists({
            [fieldName]: candidate,
        });

        if (!existingRecord) {
            return candidate;
        }
    }

    const error = new Error(`Unable to generate a unique ${prefix} identifier`);
    error.statusCode = 500;
    throw error;
};

const generateUniqueApplicationIdentifier = async (
    ApplicationModel,
    maxAttempts = 10
) =>
    generateUniqueIdentifier(
        ApplicationModel,
        "applicationIdentifier",
        APPLICATION_PREFIX,
        maxAttempts
    );

const generateUniqueTransactionId = async (PaymentModel, maxAttempts = 10) =>
    generateUniqueIdentifier(
        PaymentModel,
        "transactionId",
        TRANSACTION_PREFIX,
        maxAttempts
    );

module.exports = {
    APPLICATION_PREFIX,
    TRANSACTION_PREFIX,
    generateApplicationIdentifierCandidate,
    generateUniqueApplicationIdentifier,
    generateUniqueTransactionId,
    isApplicationIdentifier,
    isTransactionIdentifier,
    normalizeApplicationIdentifier,
    normalizeTransactionIdentifier,
};
