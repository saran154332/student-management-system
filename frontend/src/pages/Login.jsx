import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { setCredentials } from "../app/authSlice";
import API from "../api/axios";
import PasswordToggleIcon from "../components/PasswordToggleIcon";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="auth-page">
      <button
        type="button"
        className="theme-toggle auth-theme-toggle"
        onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
        aria-label="Toggle theme"
      >
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
        <span className="theme-toggle-track">
          <span className="theme-toggle-thumb" />
        </span>
      </button>

      <section className="auth-brand-panel">
        <h1>Student Management System</h1>
        <p>
          Manage students, classes, records, imports, and administrative activity
          from one polished workspace.
        </p>
        <div className="auth-highlights">
          <span>Role based access</span>
          <span>Google OAuth</span>
          <span>Excel workflows</span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Secure access</p>
          <h2>Welcome back</h2>
          <p>Sign in to continue to your school dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <button type="button" onClick={handleGoogleLogin} className="google-login-button">
            <svg className="google-icon" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.94v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.94a9 9 0 0 0 0 8.08l3.02-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .94 4.96l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="login-divider">
            <span>or sign in with email</span>
          </div>

          <div className="form-field">
            <label>Email address</label>
            <input
              type="email"
              name="email"
              placeholder="teacher@school.edu"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <PasswordToggleIcon visible={showPassword} />
              </button>
            </div>
          </div>

          <div className="auth-row">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary full-width">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          New to the system? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </div>
  );
};

export default Login;
