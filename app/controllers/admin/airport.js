const path = require("path");
const models = require("../../models").default;
const db = require("../../middleware/db");

exports.importCsvtoJson = async (req, res) => {
    const basePath = path.join(__dirname, "../../../", "airport_database.csv");
    console.log("basePath", basePath);
    const csvFilePath = basePath
    const csv = require('csvtojson')
    // // Async / await usage
    const jsonArray = await csv().fromFile(csvFilePath);

    if (jsonArray && jsonArray.length > 0) {
        let count = 0;
        console.log(jsonArray.length);
        for (let index = 0; index < jsonArray.length; index++) {
            console.log("Index", index + 1);
            const createObject = {
                airportId: jsonArray[index]["Airport ID"],
                name: jsonArray[index].Name,
                city: jsonArray[index].City,
                country: jsonArray[index].Country,
                iata: jsonArray[index].IATA,
                location: {
                    type: "Point",
                    coordinates: [jsonArray[index].Latitude, jsonArray[index].Longitude]
                },
                lat: jsonArray[index].Latitude,
                long: jsonArray[index].Longitude,
                altitude: jsonArray[index].Altitude,
                timezone: jsonArray[index].Timezone,
                dst: jsonArray[index].DST,
                databaseTimezone: jsonArray[index]["Tz database time zone"],
                type: jsonArray[index].Type,
                source: jsonArray[index].Source,
                icao: jsonArray[index].ICAO,
                addedBy: req.user._id,
            };
            await db.create(createObject, models.Airport);
            count = count + 1
        }
        return res.status(200).json({ data: count });
    }
}