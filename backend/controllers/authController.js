const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

const sendServerError = (res, message = "Something went wrong. Please try again.") => {
  return res.status(500).json({ message });
};

const generateResetCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const getTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const transporter = getTransporter();
    await transporter.sendMail({
      to: normalizedEmail,
      from: process.env.EMAIL_USER,
      subject: "Welcome to Student Management System",
      html: `<p>Welcome ${name}!</p>
             <p>Your account has been created successfully.</p>
             <p>You can now log in to the system.</p>`,
    }).catch(() => null);

    return res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }

    return sendServerError(res);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Please sign in with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendServerError(res);
  }
};

const requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Email not found" });
    }

    const resetCode = generateResetCode();

    user.resetCode = resetCode;
    user.resetCodeExpiry = new Date(Date.now() + RESET_CODE_TTL_MS);
    user.resetCodeVerified = false;
    user.resetToken = null;
    await user.save();

    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        to: normalizedEmail,
        from: process.env.EMAIL_USER,
        subject: "Password Reset Code - Student Management System",
        text: `Your password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes.\n\nDo not share this code with anyone.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your Student Management System account.</p>
            <p style="font-size: 18px; margin: 20px 0;">
              Your reset code is: <strong style="font-size: 24px; color: #007bff;">${resetCode}</strong>
            </p>
            <p style="color: #666;">This code will expire in 15 minutes.</p>
            <p style="color: #999; font-size: 12px;">Do not share this code with anyone.</p>
          </div>
        `,
      });
    } catch (emailError) {
      user.resetCode = null;
      user.resetCodeExpiry = null;
      user.resetCodeVerified = false;
      user.resetToken = null;
      await user.save();

      return res.status(502).json({
        message: "Unable to send reset code right now. Please try again later.",
      });
    }

    return res.status(200).json({ message: "Reset code sent successfully" });
  } catch (error) {
    return sendServerError(res);
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res.status(400).json({ message: "Email and reset code are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = resetCode.trim();

    if (!normalizedCode) {
      return res.status(400).json({ message: "Reset code cannot be empty" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({
        message: "No reset code request found. Please request a new reset code.",
      });
    }

    if (user.resetCode !== normalizedCode) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (new Date() > user.resetCodeExpiry) {
      return res.status(400).json({
        message: "Reset code has expired. Please request a new one.",
      });
    }

    user.resetCodeVerified = true;
    user.resetToken = crypto.randomBytes(32).toString("hex");
    await user.save();

    return res.status(200).json({
      message: "Reset code verified successfully",
      resetToken: user.resetToken,
    });
  } catch (error) {
    return sendServerError(res);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        message: "Email, reset token, and password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({
        message: "No reset code request found. Please request a new reset code.",
      });
    }

    if (!user.resetCodeVerified || !user.resetToken || user.resetToken !== resetToken) {
      return res.status(400).json({
        message: "Please verify your reset code before setting a new password.",
      });
    }

    if (new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ message: "Reset code has expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpiry = null;
    user.resetCodeVerified = false;
    user.resetToken = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return sendServerError(res);
  }
};

module.exports = { register, login, requestReset, verifyResetCode, resetPassword };
