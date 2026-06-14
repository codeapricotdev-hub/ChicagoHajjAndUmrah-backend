require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/config");
require("../app/models/mobile/applicationDocument");
require("../app/models/mobile/additionalDocumentRequest");

const run = async () => {
    const mongoUri =
        process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        config.MONGO_URI ||
        config.mongoUrl ||
        config.MONGO_URL ||
        config.dbUrl;

    if (!mongoUri) {
        throw new Error("MongoDB connection string is not configured");
    }

    await mongoose.connect(mongoUri);
    const collection = mongoose.connection.collection("applicationdocuments");
    const indexes = await collection.indexes();
    const legacyIndex = indexes.find(
        (index) =>
            index.unique &&
            index.key.applicationId === 1 &&
            index.key.applicantId === 1 &&
            index.key.docType === 1 &&
            Object.keys(index.key).length === 3
    );

    if (legacyIndex) {
        await collection.dropIndex(legacyIndex.name);
        console.log(`Dropped legacy index: ${legacyIndex.name}`);
    }

    await mongoose.model("ApplicationDocument").syncIndexes();
    await mongoose.model("AdditionalDocumentRequest").syncIndexes();
    console.log("Additional document request indexes are synced");
    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
