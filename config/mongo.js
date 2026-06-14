const mongoose = require("mongoose");
const config = require("./config");

/* let DB_URL = process.env.DEV == 'true'
  ? process.env.MONGO_URI
  : `mongodb://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`; */

const DB_URL = config.MONGO_URI;

module.exports = () => {
  const connect = () => {
    return new Promise((resolve) => {
      mongoose.Promise = global.Promise;
      mongoose.connect(
        DB_URL,
        {
          keepAlive: true,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
        (err) => {
          let dbStatus = "";
          if (err) {
            dbStatus = `*    DB1 Error connecting to DB: ${err}\n****************************\n`;
          }
          dbStatus = `*    DB1 Connection: OK\n****************************\n`;
          if (config.ENV === 'DEV' || config.ENV === 'STAGE') {
            // Prints initialization
            console.log("*************DB1***************");
            console.log("*    Starting Server");
            console.log(`*    Port: ${config.PORT || 3001}`);
            console.log(`*    NODE_ENV: ${config.ENV || "development"}`);
            console.log(`*    Database: MongoDB`);
            console.log(dbStatus);
            resolve(dbStatus);
          }
        }
      );
    });
  };
  connect();

  mongoose.connection.on("error", (err) => console.log("DB1 Error : ", err));
  mongoose.connection.on("disconnected", connect);
};
