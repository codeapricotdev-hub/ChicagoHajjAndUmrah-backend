const mongoose = require('mongoose');
const validator = require("validator");
const mongoosePaginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Service = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // S3 URL
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);


Service.plugin(mongoosePaginate);
Service.plugin(aggregatePaginate);

module.exports = mongoose.model('Service', Service);
