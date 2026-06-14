const admin = require("firebase-admin");
const serviceAccount = require("../../backend/firebase/chicago-hajj-app-firebase-adminsdk-fbsvc-2c0a9bc129.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;