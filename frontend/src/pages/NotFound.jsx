import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="notfound-box">
        <div className="notfound-emoji">😕</div>
        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Oops! Page not found</p>
        <button
          className="btn-primary"
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;