const express = require("express");
const router = express.Router();
const { register, login, requestReset, verifyResetCode, resetPassword } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/request-reset", requestReset);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

module.exports = router;