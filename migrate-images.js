// migrate-images.js
const mongoose = require("mongoose");

mongoose.set('strictQuery', true);

mongoose.connect("mongodb+srv://codeapricotdev_db_user:NnglcUjOBWqmqxTY@cluster0.bbyid1w.mongodb.net/TestDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const ServiceType = require("./app/models/mobile/serviceType"); // adjust path if needed

async function migrate() {
    try {
        await mongoose.connection.once('open', () => { });

        // Find all records that still have old `image` field
        const records = await ServiceType.find({
            image: { $exists: true }
        }).lean();

        console.log(`Found ${records.length} records to migrate`);

        if (records.length === 0) {
            console.log("No records to migrate");
            return;
        }

        for (const record of records) {
            const imageValue = record.image;

            await ServiceType.updateOne(
                { _id: record._id },
                {
                    $set: {
                        images: imageValue ? [imageValue] : []
                    },
                    $unset: { image: "" }
                }
            );

            console.log(`✅ Migrated: ${record._id} — image: "${imageValue}"`);
        }

        console.log(`\n🎉 Migration complete. ${records.length} records updated.`);
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

migrate();