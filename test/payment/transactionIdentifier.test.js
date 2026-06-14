const { expect } = require("chai");
const {
    generateApplicationIdentifierCandidate,
    generateUniqueTransactionId,
    isApplicationIdentifier,
    isTransactionIdentifier,
    normalizeTransactionIdentifier,
} = require("../../app/helpers/mobile/applicationIdentifier");

describe("transaction identifier", () => {
    it("generates TXN identifiers with the expected format", () => {
        const candidate = generateApplicationIdentifierCandidate()
            .replace(/^APP-/, "TXN-");

        expect(candidate).to.match(/^TXN-\d{6}-\d{6}$/);
        expect(isTransactionIdentifier(candidate)).to.equal(true);
        expect(isApplicationIdentifier(candidate)).to.equal(false);
    });

    it("normalizes transaction identifiers", () => {
        expect(normalizeTransactionIdentifier(" txn-260524-331649 ")).to.equal(
            "TXN-260524-331649"
        );
    });

    it("generates unique transaction IDs against a model", async () => {
        const reserved = new Set(["TXN-260524-111111"]);
        const issued = new Set();
        const PaymentModel = {
            exists: async ({ transactionId }) =>
                reserved.has(transactionId) || issued.has(transactionId),
        };

        const first = await generateUniqueTransactionId(PaymentModel);
        issued.add(first);
        const second = await generateUniqueTransactionId(PaymentModel);

        expect(first).to.match(/^TXN-\d{6}-\d{6}$/);
        expect(second).to.match(/^TXN-\d{6}-\d{6}$/);
        expect(first).to.not.equal(second);
    });
});
