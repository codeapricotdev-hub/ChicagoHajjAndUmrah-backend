const models = require("../../models").default;
const db = require("../../middleware/db");
const bcrypt = require("bcrypt");
const { JwtSign } = require("../../middleware/auth");
const { MAIN_ADMIN, MAIN_USER } = require("../../middleware/constant");
const { sendMail } = require("../../helpers/mail");
const config = require("../../../config/config");
const smtp = require("../../helpers/mail");
const s3 = require("../../helpers/s3");
const formidable = require('formidable');

const signUpAdmin = async (req, res, next) => {
  try {
    const getUser = await db.findData({
      req: {},
      model: models.User,
      query: {
        email: req.body.email,
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
      const createUser = await db.create(req.body, models.User);
      return res.status(201).json({
        success: true,
        data: {
          userId: createUser._id,
          email: createUser.email,
        },
        message: "Admin registered successfully.",
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

/**
 *
 * @param {email,password} req
 * @param {token} res
 * @param {*} next
 * @returns
 */
const adminLogin = async (req, res, next) => {
  try {
    console.log('req.body.email :>> ', req.body.email);
    const getUser = await db.findData({
      req: {},
      model: models.User,
      query: {
        email: req.body.email,
      },
    });
    console.log("getUser FULL RESPONSE:", JSON.stringify(getUser, null, 2));
    if (!getUser) {
      return res.json({
        status: 400,
        success: false,
        data: null,
        message: "Email address not found.",
      });
    }
    if (getUser.status != "active") {
      return res.json({
        status: 400,
        success: false,
        data: null,
        message: "User does not have access to login.",
      });
    }
    console.log('getUser :>> ', getUser);
    if (getUser) {
      const checkPassword = await bcrypt.compare(
        req.body.password,
        getUser.password
      );
      console.log("checkPassword :>> ", checkPassword);
      if (checkPassword) {
        const getRole = await db.findData({
          req: {},
          model: models.Role,
          query: {
            _id: getUser.role,
          },
        });
        // if (getRole && getRole.name !== MAIN_ADMIN) {
        //   return res.json({
        //     status: 400,
        //     success: false,
        //     data: null,
        //     message: "Un-Authorized.",
        //   });
        // }
        console.log("getRole", JSON.stringify(getRole, null, 2));
        const payload = {
          userId: getUser._id,
          email: getUser.email,
          fullName: getUser.fullName,
          role: getRole.name,
        };
        const token = await JwtSign(payload);
        return res.status(200).json({
          success: true,
          status: 200,
          data: {
            token: token,
            role: getRole.name,
            userId: getUser._id,
            permission: getRole.permissions ? getRole.permissions : []
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

const createAdminUser = async (req, res, nex) => {
  try {
    const getUser = await db.findData({
      req: {},
      model: models.User,
      query: {
        email: req.body.email,
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
      req.body.addedBy = req.user._id;
      const password = makeid(10);
      req.body.password = password;
      console.log("req.body.password", req.body);
      const context = {
        email: req.body.email,
        password: password
      }
      const sendEmail = await smtp.sendMailSendGrid(req.body.email, "User password Generator", "d-a12f11dd8efe45e6b86acab5f949475f", context);
      if (sendEmail) {
        const createUser = await db.create(req.body, models.User);
        console.log("createUser", createUser);
        if (createUser) {
          return res.status(201).json({
            success: true,
            data: {
              userId: createUser._id,
              email: createUser.email,
            },
            message: "User registered successfully.",
          });
        } else {
          return res.status(400).json({
            success: false,
            status: 400,
            error: true,
            message: "Something went wrong when sending email, Please try after sometimes",
          });
        }
      }
    }
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const getRecordById = await db.findById(id, models.User, "role", "fullName email password role designation");
    return res.status(200).json({
      success: true,
      status: 200,
      data: getRecordById,
      message: "Record found successfully.",
    });
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      status: error.code ? error.code : 500,
      error: true,
      message: error.message,
    });
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const { filter, page, limit } = req.query;
    const query = {
      // addedBy: req.user._id,
    };
    if (filter) {
      query["$or"] = [
        {
          fullName: { $regex: filter, $options: "i" },
        },
        {
          email: { $regex: filter, $options: "i" },
        },
        {
          designation: { $regex: filter, $options: "i" },
        }
      ];
    }
    console.log(JSON.stringify(query, null, 2));
    const getUser = await db.getData({
      req: {
        page: page || 1,
        limit: limit || 10,
        populate: [{
          path: "role",
          select: "name"
        }],
        select: "fullName email role password designation, status"
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
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const getRecordById = await db.findById(id, models.User);
    if (!getRecordById) {
      return res.status(400).json({
        success: false,
        status: 400,
        data: getRecordById,
        message: "Record not found by provided id.",
      });
    }
    if (req.body.email) {
      const checkEmail = await db.findData({
        req: {},
        model: models.User,
        query: {
          _id: { $ne: id },
          email: req.body.email
        }
      });
      if (checkEmail) {
        return res.status(400).json({
          success: false,
          status: 400,
          data: {},
          message: "Email Already Exists.",
        });
      }
    }
    const updateRecord = await db.updateData(
      id,
      models.User,
      req.body
    );
    return res.status(200).json({
      success: true,
      status: 200,
      data: updateRecord,
      message: "Record updated successfully.",
    });
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      status: error.code ? error.code : 500,
      error: true,
      message: error.message,
    });
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const getRecordById = await db.findById(id, models.User);
    if (!getRecordById) {
      return res.status(400).json({
        success: false,
        status: 400,
        data: getRecordById,
        message: "Record not found by provided id.",
      });
    }
    const removeRecord = await db.delete(id, models.User);
    return res.status(200).json({
      success: true,
      status: 200,
      data: removeRecord,
      message: "Record deleted successfully.",
    });
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      status: error.code ? error.code : 500,
      error: true,
      message: error.message,
    });
  }
};

function makeid(length,) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ()!@#$%^&*?/*abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const uploadXmlFileS3 = async (req, res, next) => {
  try {
    var form = new formidable.IncomingForm();
    form.multiples = true;
    form.parse(req, async function (err, fields, files) {
      const { file } = files;
      if (file.type.includes("xml")) {
        const location = await s3.uploadOnS3SiteMap(file.name, file.path, process.env.S3_BUCKET_NAME_SITEMAP);
        return res.status(200).json({
          success: true,
          status: 200,
          data: location.data,
          message: "File uploaded successfully.",
        });
      } else {
        return res.status(400).json({
          success: false,
          status: 400,
          error: true,
          message: "File should be XML only",
        });
      }
    });
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      status: error.code ? error.code : 500,
      error: true,
      message: error.message,
    });
  }
}
const reSetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!req.body.userId) {
      return res.status(500).json({
        success: false,
        error: true,
        message: "User Id is required.",
      });
    }
    const getUser = await db.findData({
      req: {},
      model: models.User,
      query: { _id: req.body.userId },
    });
    if (getUser && req.body.userId) {
      getUser.password = password;
      const updateUser = await getUser.save();

      return res.status(200).json({
        success: true,
        data: { email: getUser.email },
        message: "Password changed successfully.",
      });
    }
  } catch (error) {
    return res.status(error.code ? error.code : 500).json({
      success: false,
      error: true,
      message: error.message,
    });
  }
}

module.exports = {
  signUpAdmin,
  adminLogin,
  createAdminUser,
  getAdminUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadXmlFileS3,
  reSetPassword
};
