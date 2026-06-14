const controller = require("../../controllers/website/controller");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../middleware/auth");
const passport = require("passport");
const { verifyAdminRoles } = require('../../middleware/verifyRoles');

route.get("/website/getAllBlog", controller.getAllBlog);
route.get("/website/getBlogDetail/:slug", controller.getBlogDetail);
route.get("/website/getAllFaq", controller.getAllFaq);
route.get("/website/getAllFaqType", controller.getAllFaqType);
route.get("/website/getAllImageGallery", controller.getAllImageGallery);
route.get("/website/getAllVideoGallery", controller.getAllVideoGallery);
route.get("/website/getCategoryViseVideoGallery", controller.getAllCategoryVideoGallery);
route.get("/website/getCategoryViseImageGallery", controller.getAllCategoryImageGallery);
route.get("/website/getAllAirports", controller.getAllAirports);
route.get("/website/v2/getAllAirports", controller.getAllAirportsV2);
route.get("/website/getAllCountry", controller.getAllCountry);
route.get("/website/getAllFAQByTypes", controller.getAllFAQBasedOnFAQTypes);
route.get("/website/getAllReviews", controller.getAllReviews);
route.get("/website/getAllPackages", controller.getAllPackages);
route.get("/website/getPackageDetail/:slug", controller.getPackageDetail);

route.get("/website/getPrivacyPolicy", controller.getPrivacyPolicy);
route.get("/website/getTermsAndCondition", controller.getTermsAndCondition);
route.get("/website/getAllBanners", controller.getAllBanners);


//Inquary
route.use("/website/inquiry", require("./inquiry"));


module.exports = route;