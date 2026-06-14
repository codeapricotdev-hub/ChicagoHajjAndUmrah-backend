const smtp = require("../../helpers/mail");
const sendGridMail = require("@sendgrid/mail");
const moment = require('moment');

const airlines = [
  {
    name: "American Airlines",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/a092a84b-dde7-45a8-9133-7b4c9e472532/1224x186.png"
  },
  {
    name: "Emirates",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/206b5798-d8b1-46c6-9740-0595076e6a5f/320x222.png"
  },
  {
    name: "Qatar Airways",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/47ae52dd-8661-43a4-b487-ba7f9b3ee959/320x91.png"
  },
  {
    name: "Turkish Airlines",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/cad1585f-18dc-4375-85a2-f089eec82ff8/330x53.png"
  },
  {
    name: "Lufthansa",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/1ed9d489-c749-45c0-8576-48f782e9a637/330x58.png"
  },
  {
    name: "Singapore Airlines",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/bd3162ba-6a98-4ab4-b890-c575d5de2ab1/330x122.png"
  },
  {
    name: "Etihad Airways",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/f077ea0e-87e0-435e-a774-3524ce8b0cd5/320x114.png"
  },
  {
    name: "Delta Air Lines",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/e349bf0b-e114-41b5-9095-a7069932a124/330x51.png"
  },
  {
    name: "Royal Jordanian",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/a548af07-deaf-481b-ae7c-6dea626d91b7/320x75.png"
  },
  {
    name: "Egyptair",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/cdda35ca-f75c-443c-8118-6577b9b0b08c/330x50.png"
  },
  {
    name: "Saudi Arabian Airlines",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/7a6b451b-90ff-4835-9517-3027beda8dcb/401x480.png"
  },
  {
    name: "Ethiopian Airlines",
    logo: "http://cdn.mcauto-images-production.sendgrid.net/8cd1aac843df621e/a279d453-17bb-477a-8d76-b8a4b973fbb9/570x240.png"
  }
];

const sendEmail = async (req, res, next) => {
  try {
    let emailData = {};
    const {
      customerName,
      customerEmail,
      subject,
      content,
      departDate,
      departSection,
      returnDate,
      returnSection,
      grandTotal,
    } = req.body;

    const formattedDepartDate = moment(departDate).local().format('ddd, MMM D');
    const formattedReturnDate = moment(returnDate).local().format('ddd, MMM D');

    const attachAirlineLogos = (flights, airlineList) =>
      flights.map((flight) => {
        const matched = airlineList.find((a) => a.name === flight.airline);

        const from = moment(flight.fromDate);
        const to = moment(flight.toDate);

        const duration = moment.duration(to.diff(from));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();

        return {
          ...flight,
          airlineLogo: matched?.logo || null,
          fromDate: from.local().format('ddd, MMM D, hh:mm A'),
          toDate: to.local().format('ddd, MMM D, hh:mm A'),
          flightDuration: `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`,
        };
      });

    // Prepare dynamic_template_data
    const dynamicData = {
      type: 'flightDetails',
      customerName,
      subject,
      message: content
    };

    if(grandTotal && grandTotal > 0){
      dynamicData.grandTotal = grandTotal;
    }

    if (Array.isArray(departSection) && departSection.length > 0) {
      dynamicData.departDate = formattedDepartDate;
      dynamicData.departSection = attachAirlineLogos(departSection, airlines);
    }

    if (Array.isArray(returnSection) && returnSection.length > 0) {
      dynamicData.returnDate = formattedReturnDate;
      dynamicData.returnSection = attachAirlineLogos(returnSection, airlines);
    }

    emailData = {
      from: 'noreply@chicagohajj.com',
      templateId: 'd-dca90223432c4736b342c49368c72756',
      to: customerEmail,
      dynamic_template_data: dynamicData,
    };

    console.log(emailData);

    const sendEmail = await sendGridMail.send(emailData);

    if (sendEmail) {
      return res.json({
        status: 200,
        success: true,
        data: sendEmail,
        message: 'Email sent successfully..',
      });
    } else {
      return res.status(400).json({
        success: false,
        status: 400,
        error: true,
        message: 'Something went wrong when sending email, Please try after sometimes',
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


// const sendEmail = async (req, res, next) => {
//
//   try {
//
//     let emailData = {};
//     const { customerName, customerEmail, subject, content, departDate,  departSection, returnDate, returnSection, grandTotal } = req.body;
//
//     const formattedDepartDate = moment(departDate).local().format('ddd, MMM D');
//     const formattedReturnDate = moment(returnDate).local().format('ddd, MMM D');
//
//     const attachAirlineLogos = (flights, airlineList) =>
//       flights.map((flight) => {
//         const matched = airlineList.find((a) => a.name === flight.airline);
//
//         const from = moment(flight.fromDate);
//         const to = moment(flight.toDate);
//
//         const duration = moment.duration(to.diff(from));
//         const hours = Math.floor(duration.asHours());
//         const minutes = duration.minutes();
//
//         return {
//           ...flight,
//           airlineLogo: matched?.logo || null,
//           fromDate: from.local().format('ddd, MMM D, hh:mm A'),
//           toDate: to.local().format('ddd, MMM D, hh:mm A'),
//           flightDuration: `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
//         };
//       });
//
//     const departSectionMatch = attachAirlineLogos(departSection, airlines);
//     const returnSectionMatch = attachAirlineLogos(returnSection, airlines);
//
//     emailData = {
//       ...emailData,
//         from: "noreply@chicagohajj.com",
//         templateId: "d-dca90223432c4736b342c49368c72756",
//         subject: subject,
//         to: customerEmail,
//         dynamic_template_data: {
//           type: "flightDetails",
//           customerName,
//           message: content,
//           departDate: formattedDepartDate,
//           departSection: departSectionMatch,
//           returnDate: formattedReturnDate,
//           returnSection: returnSectionMatch,
//           grandTotal,
//         }
//     }
//
//     console.log(emailData)
//
//     const sendEmail = await sendGridMail.send(emailData);
//
//     if (sendEmail) {
//       return res.json({
//         status: 200,
//         success: true,
//         data: sendEmail,
//         message: "Email sent successfully..",
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         status: 400,
//         error: true,
//         message: "Something went wrong when sending email, Please try after sometimes",
//       });
//     }
//
//   } catch (error) {
//     return res.status(error.code ? error.code : 500).json({
//       success: false,
//       error: true,
//       message: error.message,
//     });
//   }
// };

module.exports = {
  sendEmail,
};
