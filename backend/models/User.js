const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "teacher"],
      default: "teacher",
    },
    resetCode: {
      type: String,
      default: null,
    },
    resetCodeExpiry: {
      type: Date,
      default: null,
    },
    resetCodeVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
