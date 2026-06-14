const nodemailer = require("nodemailer");
const path = require("path");
const hbs = require("nodemailer-express-handlebars");
const config = require("../../config/config");
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY_SG);

let transport = nodemailer.createTransport({
  pool: true,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
});
// point to the template folder
const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve('./views/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./views/'),
};

// use a template file with nodemailer
transport.use('compile', hbs(handlebarOptions))
const sendMail = async (toMail, subject, template, context, referenceId) => {
  return new Promise(async (resolve, reject) => {


    const msg = { from: process.env.SMTP_USER, to: toMail, subject: subject, template: template, context: context };
    const msgForAdmin = { from: process.env.SMTP_USER, to: "info@chicagohajj.com", subject: `New ${context.type} inquiry`, template: "adminInquiry", context: { refNo: referenceId, type: context.type } };
    try {
      const sendEmail = await transport.sendMail(msg);
      const sendEmailToAdmin = await transport.sendMail(msgForAdmin);
      console.log("sendEmail", sendEmail);
      console.log("sendEmailToAdmin", sendEmailToAdmin);
      return resolve(true);
    } catch (error) {
      console.log("error ::=> ", error, error.code);
      if (error.code === "EAUTH") {
        return reject({ code: 401, message: "Invalid SMTP Details" });
      }
      return reject({ code: 500, message: error.message });
    }
  });
};

const setPasswordMail = async (toMail, subject, template, context) => {
  return new Promise(async (resolve, reject) => {


    const msg = { from: process.env.SMTP_USER, to: toMail, subject: subject, template: template, context: context };
    try {
      const sendEmail = await transport.sendMail(msg);
      console.log("sendEmail", sendEmail);
      return resolve(true);
    } catch (error) {
      console.log("error ::=> ", error, error.code);
      if (error.code === "EAUTH") {
        return reject({ code: 401, message: "Invalid SMTP Details" });
      }
      return reject({ code: 500, message: error.message });
    }
  });
}

const sendMailSendGrid = async (toMail, subject, template, context, referenceId) => {

  return new Promise(async (resolve, reject) => {
    try {
      let contact_no=formatPhoneNumber(context.mobileNumber);
      const msg = {
        from: "noreply@chicagohajj.com",//process.env.SMTP_USER,
        templateId: template,
        subject: context.subject_for_user?context.subject_for_user:subject,
        to: toMail,
        dynamic_template_data: {
          fullName: context.fullName,
          type: context.type,
          password: context.password,
          email: context.email,
          token:context.token,
          mobileNumber: contact_no
        },
      };
      // const msgForAdmin = { from: process.env.SMTP_USER, to: "info@chicagohajj.com", subject: `New ${context.type} inquiry`, template: "adminInquiry", context: { refNo: referenceId, type: context.type } };
      const result = await sendGridMail.send(msg);
      if (!context.password) {
        const msgForAdmin = {
          from: "noreply@chicagohajj.com",//process.env.SMTP_USER,
          subject: subject,
          templateId: "d-5e0eaa2f76d24084aa2ff07fc78fbc07",
          to: "tkt@chicagohajj.com",
          dynamic_template_data: {
            ...context,
            fullName: context.fullName,
            type: context.type,
            email: context.email,
            mobileNumber: contact_no,
            option: context.option?context.option:"-",
            refNo: referenceId
          },
        };

        const resultForAdmin = await sendGridMail.send(msgForAdmin);
        console.log("resultForAdmin", resultForAdmin);
      }
      console.log("result", result);
      return resolve(true);
    } catch (error) {
      console.log("error in mail",error);
      console.log("error ::=> ", JSON.stringify(error, null, 2), error.code);
      if (error.code === "EAUTH") {
        return reject({ code: 401, message: "Invalid SMTP Details" });
      }
      return reject({ code: 500, message: error.message });
    }
  });
}
function formatPhoneNumber(phoneNumber) {
  // Remove any non-numeric characters
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');

  // Check if the input is a valid 10-digit number
  if (cleaned.length !== 10) {
      return phoneNumber;
  }

  // Format the number
  const part1 = cleaned.slice(0, 3);
  const part2 = cleaned.slice(3, 6);
  const part3 = cleaned.slice(6, 10);

  return `(${part1})-${part2}-${part3}`;
}


module.exports = { sendMail, setPasswordMail, sendMailSendGrid };
