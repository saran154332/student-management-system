import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { setCredentials } from "../app/authSlice";

const OAuthSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (!token || !userParam) {
      toast.error("Google login failed");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      dispatch(setCredentials({ token, user }));
      toast.success("Login successful");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error("Google login failed");
      navigate("/login", { replace: true });
    }
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Signing you in...</h1>
          <p className="login-subtitle">Please wait while Google login finishes.</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthSuccess;
