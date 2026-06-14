require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const passport = require("passport");
const app = express();
const initMongo = require("./config/mongo");
const config = require("./config/config");
const smtp = require("./app/helpers/mail");
// Setup express server port from ENV, default: 3000
app.set("port", config.PORT || 3001);
const path = require('path');
const axios = require("axios");
const dbActions = require("./app/middleware/db")
const allModels = require("./app/models").default

require('./app/middleware/jwtAuth')(passport);
// for parsing json
// app.use(
//   express.json({
//     limit: "50mb",
//   })
// );
// // for parsing application/x-www-form-urlencoded
// app.use(
//   express.urlencoded({
//     limit: "50mb",
//     extended: true,
//   })
// );
// Enable only in development HTTP request logger middleware
if (config.ENV === "DEV" || config.ENV === "STAGE") {
  app.use(morgan("dev"));
}

const { handleStripeWebhook } = require("./app/helpers/mobile/stripeWebhookHandler");

app.post(
  "/api/mobile/payment/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(bodyParser.json({ limit: '50mb' }));

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000000 }))

//for Helth check
app.get("/test", async (req, res) => {
  try {
    const subject = " E-Visa Inquiry";
    const fullName = "Jignesh Bariya";
    const email = "jignesh_chicago@mailinator.com"
    let html = `<html><body><h3>Assalam O Alaikum ( السلام و عليكم و رحمة الله و بركاته )</h3><br><h3>${fullName} for your time to fill the form.</h3><br><h3><p>Your query has been received and will be attended shortly. Our staff will assist you for your trip step by step.</p></h3>`
    const sendEmail = await smtp.sendMail(email, subject, html);
    console.log(sendEmail);
    res.send("OK");
  } catch (error) {
    console.log("error.message", error.message);
    return res.status(500).json({ err: error.message });
  }
});

app.get("/static-data", (req, res) => {
  const resp = {
    blog: `${process.env.BACK_END_URL}/public/blog`,
    imageGallery: `${process.env.BACK_END_URL}/public/imageGallery`,
    videoGallery: `${process.env.BACK_END_URL}/public/videoGallery`
  };
  return res.status(200).json({
    success: true,
    status: 200,
    data: resp,
    message: "Success.",
  });
})

/**
 * use cors
 */
app.use(cors({
  origin: "*"
}));

/**
 * allow cors origin
 */
app.use(function (req, res, next) {
  console.log("🔥 INCOMING REQUEST:", req.method, req.originalUrl);
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,authorization"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.post("/getAuthToken", async (req, res) => {
  try {
    const postParams = {
      ssl_merchant_id: parseInt(0022667),
      ssl_user_id: "apiuser456640",
      ssl_pin: "CW2YFMMN802AKVKM4ZYEVO8OGOACC1MRXK9HDQLRXIMN2PXYUUF231ASKCARN9F5", //process.env.SSL_PIN,
      ssl_transaction_type: "ccsale"
    }

    if (req.query.user == 1) {
      const postParams = {
        ssl_merchant_id: "0022667",
        ssl_user_id: "apiuser456640",
        ssl_pin: "CW2YFMMN802AKVKM4ZYEVO8OGOACC1MRXK9HDQLRXIMN2PXYUUF231ASKCARN9F5", //process.env.SSL_PIN,
        ssl_transaction_type: "ccsale"
      }
      console.log("postParams", postParams);
      const getToken = await axios.post("https://api.demo.convergepay.com/hosted-payments/transaction_token", postParams);
      console.log("getToken", getToken.data);
      return res.status(200).json({ token: getToken });
    } else {
      const postParams = {
        ssl_merchant_id: "0022667",
        ssl_user_id: "apiuser",
        ssl_pin: "CB5XG1NB7W4L6NNPQGO3PMWOD9BBWMTFECECTIGTWAN1E7ARCGXP1POQKG9DOGQL", //process.env.SSL_PIN,
        ssl_transaction_type: "ccsale"
      }

      console.log("postParams", postParams);
      const getToken = await axios.post("https://api.demo.convergepay.com/hosted-payments/transaction_token", postParams);
      console.log("getToken", getToken.data);
      return res.status(200).json({ token: getToken });
    }
  } catch (error) {
    console.log("error", error.message);
    return res.status(200).json({ error: error.message });
  }
})

// Stripe
// View Engine Setup
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var Publishable_Key = process.env.STRIPE_PUBLIC_KEY;

app.post('/payment', function (req, res) {

  // Moreover you can take more details from user
  // like Address, Name, etc from form
  stripe.customers.create({
    email: req.body.stripeEmail,
    source: req.body.stripeToken,
    name: 'Gourav Hammad',
    address: {
      line1: 'TC 9/4 Old MES colony',
      postal_code: '452331',
      city: 'Indore',
      state: 'Madhya Pradesh',
      country: 'India',
    }
  })
    .then((customer) => {
      console.log("customer", customer);
      return stripe.charges.create({
        amount: 2500,     // Charging Rs 25
        description: 'Web Development Product',
        currency: 'INR',
        customer: customer.id
      });
    })
    .then((charge) => {
      console.log("charge", charge);
      res.send("Success")  // If no error occurs
    })
    .catch((err) => {
      console.log("err", err.message);
      res.send(err)       // If some error occurs
    });
});

app.post("/getPaymentLink", async (req, res) => {
  try {

    let { type, inquiryTypeId, no_of_non_usa, usa_canada, person } = req.body;
    if (!type) {
      return
    }
    const transactionCreateObject = {};
    let itemArray = [];
    if (type == "e_visa") {
      transactionCreateObject["inquiryType"] = type;
      transactionCreateObject["inquiryTypeId"] = inquiryTypeId;

      if (parseInt(usa_canada) > 0) {
        itemArray.push({
          "price": process.env.CANADA_PRICE_KEY, // "price_1MjHIGGu75XwHXeRmjCKPpv5",
          "quantity": parseInt(usa_canada)
        });
      }
      if (parseInt(no_of_non_usa) > 0) {
        itemArray.push({
          "price": process.env.NON_CANADA_PRICE_KEY, //"price_1MjHJUGu75XwHXeRJfHOTBq6",
          "quantity": parseInt(no_of_non_usa)
        });
      }
    } else if (type == "Hajj Deposit") {
      transactionCreateObject["inquiryType"] = type;
      transactionCreateObject["packageInquiryId"] = inquiryTypeId;
      if (parseInt(person) > 0) {
        itemArray = [
          {
            "price": process.env.HAJ_PRICE_KEY, //"price_1MjHKsGu75XwHXeRQmc8WkN9",
            "quantity": parseInt(person)
          }
        ];
      } else {
        return res.json({
          status: 400,
          success: false,
          data: null,
          message: "Number Of Person length required.",
        });
      }
    } else if (type == "Umrah Deposit") {
      transactionCreateObject["inquiryType"] = type;
      transactionCreateObject["packageInquiryId"] = inquiryTypeId;
      if (parseInt(person) > 0) {
        itemArray = [
          {
            "price": process.env.UMRAH_PRICE_KEY, //"price_1MjHLKGu75XwHXeRqSzUrLnO",
            "quantity": parseInt(person)
          }
        ];
      } else {
        return res.json({
          status: 400,
          success: false,
          data: null,
          message: "Number Of Person length required.",
        });
      }
    } else if (type == "saudi_evisa") {
      transactionCreateObject["inquiryType"] = type;
      transactionCreateObject["inquiryTypeId"] = inquiryTypeId;

      if (parseInt(usa_canada) > 0) {
        itemArray.push({
          "price": process.env.SAUDI_PRICE_KEY, // "price_1MjHIGGu75XwHXeRmjCKPpv5",
          "quantity": parseInt(usa_canada)
        });
      }
      if (parseInt(no_of_non_usa) > 0) {
        itemArray.push({
          "price": process.env.NON_CANADA_PRICE_KEY, //"price_1MjHJUGu75XwHXeRJfHOTBq6",
          "quantity": parseInt(no_of_non_usa)
        });
      }
      console.log("saudi_evisa", itemArray);
    } else if (type == "hajj_inquiry") {
      transactionCreateObject["inquiryType"] = type;
      transactionCreateObject["packageInquiryId"] = inquiryTypeId;
      if (parseInt(person) > 0) {
        itemArray = [
          {
            "price": process.env.HAJ_INQUIRY_PRICE_KEY, //"price_1MjHKsGu75XwHXeRQmc8WkN9",
            "quantity": parseInt(person)
          }
        ];
      } else {
        return res.json({
          status: 400,
          success: false,
          data: null,
          message: "Number Of Person length required.",
        });
      }
    }
    if (itemArray.length > 0) {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: itemArray,
      });
      transactionCreateObject["paymentLink"] = paymentLink.id;
      const createTransaction = await dbActions.create(transactionCreateObject, allModels.Transaction);
      console.log("createTransaction", createTransaction);
      return res.json({
        success: true,
        data: paymentLink,
        message: "Url Successfully get"
      })
    } else {
      return res.json({
        status: 400,
        success: false,
        data: null,
        message: "Type and according to that type number of person data required.",
      });
    }
  } catch (error) {
    return res.json({
      success: false,
      data: null,
      message: error.message
    })
  }
});

app.post("/getTransactionResponse", async (req, res) => {
  console.log("Coming");
  try {
    console.log("req.body", req.body.data);
    const createObject = {
      transactionAmount: req.body?.data?.object?.amount_total,
      transactionId: req.body?.data?.object?.id,
      paymentStatus: req.body?.data?.object?.payment_status,
      mode: req.body?.data?.object?.mode,

    };
    console.log("createObject", createObject);
    console.log("req.body", req.body, JSON.stringify(req.body.data, null, 2));
    console.log("req.body?.data?.object?.payment_link", req.body.data.object.payment_link);
    const getTransaction = await dbActions.findData({ req: {}, model: allModels.Transaction, query: { paymentLink: req.body?.data?.object?.payment_link } });
    console.log("getTransaction", getTransaction);
    if (getTransaction) {
      const updateTransaction = await dbActions.updateData(getTransaction._id, allModels.Transaction, createObject);
      console.log("updateTransaction", updateTransaction);
      return res.status(200).json({ success: true, data: updateTransaction, status: 200 });
    } else {
      const createTransaction = await dbActions.create(createObject, allModels.Transaction);
      console.log("createTransaction", createTransaction);
      return res.status(200).json({ success: true, data: createTransaction, status: 200 });
    }
  } catch (error) {
    console.log("error", error.message);
    return res.status(500).json({ message: error.message })
  }
});

// Init all other stuff
app.use(passport.initialize());
app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use('/public', express.static(path.join(__dirname, '/public')));
const route = require("./app/routes");
const { log } = require("console");
app.use(route);
module.exports = app;

Promise.all([initMongo()])
  .then((values) => {
    app.listen(app.get("port"), async () => {
      // const updateAdminRolesPermission = [
      //   {
      //     "title": "Users",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "Packages",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "Inquiries",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "Transactions",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "Media",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "FAQs",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "Blogs",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "Roles",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   },
      //   {
      //     "title": "Icons",
      //     "actions": {
      //       "view": true,
      //       "edit": true,
      //       "delete": true,
      //       "create": true
      //     },
      //   }
      // ];
      // await allModels.Role.updateOne({ name: "admin" }, { $set: { permissions: updateAdminRolesPermission } })
      console.log(
        `Server listening in ${config.ENV} mode to the port ${app.get(
          "port"
        )} ${new Date()}`
      );
    });
    app.timeout = 320000;
  })
  .catch((error) => {
    console.log("config error >> ", error);
  });
