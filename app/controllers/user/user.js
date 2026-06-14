const models = require("../../models").default;
const db = require("../../middleware/db");
const bcrypt = require("bcrypt");
const { JwtSign } = require("../../middleware/auth");
const { sendMail } = require("../../helpers/mail");
const { MAIN_USER, MAIN_ADMIN } = require("../../middleware/constant");
const config = require("../../../config/config");
const smtp = require("../../helpers/mail");
/**
 *
 * @param {email,password} req
 * @param {token} res
 * @param {*} next
 * @returns
 */
const login = async (req, res, next) => {
  try {
    const getUser = await db.findData({
      req: {},
      model: models.User,
      query: {
        email: req.body.email,
      },
    });
    if (getUser) {
      if (!getUser.isEmailVerified) {
        return res.json({
          status: 400,
          success: false,
          data: null,
          message: "Email address not verified.",
        });
      }
      const checkPassword = await bcrypt.compare(
        req.body.password,
        getUser.password
      );
      console.log("checkPassword :>> ", checkPassword);
      if (checkPassword) {
        const payload = {
          userId: getUser._id,
          email: getUser.email,
          fullName: getUser.fullName,
          role: getUser.user_type,
        };
        const token = await JwtSign(payload);
        return res.status(200).json({
          success: true,
          status: 200,
          data: {
            token: token,
          },
          message: "LoggedIn Successfully.",
        });
      } else {
        return res.json({
          status: 400,
          success: false,
          data: null,
          message: "Invalid Password.",
        });
      }
    } else {
      return res.json({
        status: 400,
        success: false,
        data: null,
        message: "Email address not found.",
      });
    }
  } catch (error) {
    console.log("error :>> ", error);
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const verifyUserEmailAndSetPassword = async (req, res, next) => {
  try {
    const { verificationCode } = req.params;
    const { password } = req.body;
    if (password === "") {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Provide password. It's not acceptable blank.",
      });
    }
    const getUser = await db.findData({
      req: {},
      model: models.User,
      query: { verification: verificationCode },
    });
    if (getUser) {
      getUser.password = password;
      getUser.isEmailVerified = true;
      const updateUser = await getUser.save();
      return res.status(200).json({
        success: true,
        data: { email: updateUser.email },
        message: "Password successfully changed or updated..",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: true,
        message:
          "User not found with provided verification code or Invalid Code",
      });
    }
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const getUser = await db.findData({
      req: {},
      model: models.User,
      query: {
        email: req.body.email,
      },
    });
    if (getUser) {
      const createObject = {
        email: email,
        userId: getUser._id,
      };
      const createForgetPassword = await db.create(
        createObject,
        models.ForgetPassword
      );
      if (createForgetPassword) {
        // const sendVerificationEmail = {
        //   to: createForgetPassword.email,
        //   subject: "Reset Password",
        //   body: `<h1>Hii! Welcome to our system. Please click provided link for reset your password : </h1>`,
        //   fullName: "",
        //   template: config.SENGRID_RESET_PASSWORD,
        //   ctaLink:config.WEBSITE_URL + 'authorization-set-pass' + '/' + createForgetPassword.verification
        // };
        // console.log("body", sendVerificationEmail.body);
        const context = {
          token: createForgetPassword.verification
        }
        const sendEmail = await smtp.sendMailSendGrid(req.body.email, "Forgot Password", "d-36300b436d784e4393591b68e0446654", context);
        console.log("sendEmail", sendEmail);
        if (createForgetPassword) {
          if (sendEmail) {
            return res.status(200).json({
              success: true,
              data: {
                email: createForgetPassword.email,
              },
              message: "Check your email address for reset password.",
            });
          } else {
            const deleteForgotPasswordEntry = await db.delete(
              createForgetPassword._id,
              models.ForgetPassword
            );
            console.log("deleteForgotPasswordEntry", deleteForgotPasswordEntry);
            return res.status(200).json({
              success: false,
              error: true,
              data: null,
              message:
                "Something went wrong while sending email.Please try after sometimes",
            });
          }
        }
      } else {
        return res.json({
          success: false,
          status: 500,
          message: "Something went wrong",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: true,
        message: "User not found with provided Email address.",
      });
    }
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const setNewPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { verificationCode } = req.params;

    const getForgetPasswordData = await db.findData({
      req: {},
      model: models.ForgetPassword,
      query: { verification: verificationCode, },
    });
    if (getForgetPasswordData) {
      if (getForgetPasswordData.used) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "Verification code already verified. Please try again.",
        });
      } else {
        const getUser = await db.findData({
          req: {},
          model: models.User,
          query: { _id: getForgetPasswordData.userId },
        });
        if (getUser) {
          console.log('getUser', getUser)
          getUser.password = password;
          const updateUser = await getUser.save();
          getForgetPasswordData.used = true;
          await getForgetPasswordData.save();
          return res.status(200).json({
            success: true,
            data: {email:getUser.email},
            message: "Password changed successfully.",
          });
        } else {
          if (getForgetPasswordData.used) {
            return res.status(400).json({
              success: false,
              error: true,
              message: "User not found against provided code.",
            });
          }
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Invalid Verification Code.",
      });
    }
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const getNewUserEmail = async (req, res) => {
  try {
    const getUserEmail = await db.findData({
      req: {},
      model: models.User,
      query: {
        verification: req.body.verification,
        role: MAIN_USER.USER,
      },
      select: "email",
      isReturn: {},
      options: {}
    })
    if (getUserEmail) {
      return res.json({
        status: 200,
        success: true,
        data: getUserEmail,
        message: "Email found successfully..",
      });
    } else {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized for this route",
      });
    }

  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const createOwnUser = async (req, res, nex) => {
  try {
    if (req.user && req.user.role === MAIN_USER.USER || req.user.role === MAIN_ADMIN) {
      const getUser = await db.findData({
        req: {},
        model: models.User,
        query: {
          email: req.body.email,
          role: MAIN_USER.USER,
        },
      });

      console.log("getUser :>> ", getUser);
      if (getUser) {
        return res.json({
          status: 400,
          success: false,
          error: false,
          message: "Provided email address already exists.",
        });
      } else {
        req.body.role = MAIN_USER.USER;
        req.body.addedBy = req.user._id;
        const createUser = await db.create(req.body, models.User);
        const sendVerificationEmail = {
          to: createUser.email,
          subject: "Please verify your email address",
          body: `<h1>Hii! Welcome to our system. Please click provided link for verify email address : </h1>`,
          fullName: createUser.fullName,
          template: config.SENDGRID_NEW_INVITE,
          ctaLink: config.WEBSITE_URL + 'authorization-accept-invitation' + '/' + createUser.verification
        };
        if (createUser) {
          const sendEmail = await sendMail(
            sendVerificationEmail.to,
            sendVerificationEmail.subject,
            sendVerificationEmail.body,
            sendVerificationEmail.fullName,
            sendVerificationEmail.template,
            sendVerificationEmail.ctaLink
          );
          console.log("sendEmail :>> ", sendEmail);
          return res.status(201).json({
            success: true,
            data: {
              userId: createUser._id,
              email: createUser.email,
            },
            message: "User registered successfully.",
          });
        }
      }
    } else {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized for this route",
      });
    }
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const getOwnUser = async (req, res, next) => {
  try {
    const { filter, page, limit } = req.query;
    console.log("filter", req.query)
    if (req.user && req.user.role === MAIN_USER.USER || req.user.role === MAIN_ADMIN) {
      const query = {
        $and: [
          { role: MAIN_USER.USER, }
        ]
      };
      if (filter) {
        query["$and"].push({
          $or: [
            {
              fullName: { $regex: filter, $options: 'i' }
            },
            {
              email: { $regex: filter, $options: 'i' }
            }
          ]
        })
      }
      console.log("Query", JSON.stringify(query, null, 2))
      const getUser = await db.getData({
        req: {
          page: page || 1,
          limit: limit || 10
        },
        model: models.User,
        query: query,
      });
      return res.json({
        status: 200,
        success: true,
        data: getUser,
        message: "User's record(s) found successfully..",
      });
    } else {
      return res.status(401).json({
        success: false,
        error: true,
        message: "Unauthorized for this route",
      });
    }
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteUser = await db.delete(id, models.User);
    return res.status(200).json({
      success: true,
      data: deleteUser,
      message: "User deleted successfully."
    })
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

const editUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateUser = await db.updateData(id, models.User, req.body);
    return res.status(200).json({
      success: true,
      data: updateUser,
      message: "User updated successfully."
    })
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

module.exports = {
  login,
  verifyUserEmailAndSetPassword,
  forgetPassword,
  setNewPassword,
  getNewUserEmail,
  createOwnUser,
  getOwnUser,
  deleteUser,
  editUser
};
