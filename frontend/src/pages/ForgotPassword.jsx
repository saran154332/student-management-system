import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = resetCode.trim();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/auth/request-reset", { email: normalizedEmail });
      toast.success("Reset code sent to your email");
      setResetToken("");
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!normalizedCode) {
      toast.error("Please enter the reset code from your email");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/verify-reset-code", {
        email: normalizedEmail,
        resetCode: normalizedCode,
      });
      setResetToken(response.data.resetToken);
      toast.success("Code verified. Enter your new password");
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to verify reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/reset-password", {
        email: normalizedEmail,
        resetToken,
        newPassword,
      });
      toast.success("Password reset successful");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">Reset</div>
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">
            {step === 1 && "Step 1: Enter your email address"}
            {step === 2 && "Step 2: Enter the reset code"}
            {step === 3 && "Step 3: Enter your new password"}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestReset} className="login-form">
            <div className="login-input-group">
              <label className="login-label">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="login-input-group">
              <label className="login-label">RESET CODE</label>
              <p className="login-help">
                Check your email for the 6-digit code.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter the code from your email"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                className="login-input"
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setResetCode("");
              }}
              className="login-button secondary"
            >
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="login-input-group">
              <label className="login-label">NEW PASSWORD</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="login-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">CONFIRM PASSWORD</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="login-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="login-button secondary"
            >
              Back
            </button>
          </form>
        )}

        <p className="login-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
