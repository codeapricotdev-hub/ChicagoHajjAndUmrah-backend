const UserController = require("../../../controllers/user/user");
const validate = require("./validator");
const express = require("express");
const route = express.Router();
const { JwtDecode } = require("../../../middleware/auth");
const passport = require("passport");

route.post("/auth/login", validate.login, UserController.login);
route.post("/auth/verifyUser/:verificationCode", UserController.verifyUserEmailAndSetPassword);
route.post("/forgetPassword", UserController.forgetPassword);
route.post("/setNewPassword/:verificationCode", UserController.setNewPassword);
route.post("/auth/getNewUserEmail", UserController.getNewUserEmail);
route.post("/createUser", passport.authenticate("jwt", { session: false }), UserController.createOwnUser);
route.get("/getUser", passport.authenticate("jwt", { session: false }), UserController.getOwnUser);
route.delete("/:id", passport.authenticate("jwt", { session: false }), UserController.deleteUser);
route.patch("/:id", passport.authenticate("jwt", { session: false }), UserController.editUser);

module.exports = route;
