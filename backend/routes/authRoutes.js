const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { register, login, requestReset, verifyResetCode, resetPassword } = require("../controllers/authController");

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

router.post("/register", register);
router.post("/login", login);
router.post("/request-reset", requestReset);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

router.get(
  "/google",
  (req, res) => {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid profile email",
      prompt: "select_account",
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  }
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${clientUrl}/login`,
    session: false,
  }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userData = encodeURIComponent(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
    }));

    return res.redirect(`${clientUrl}/oauth-success?token=${token}&user=${userData}`);
  }
);

module.exports = router;
