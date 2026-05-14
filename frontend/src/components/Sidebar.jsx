import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../app/authSlice";
import toast from "react-hot-toast";

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        toast.success("Logged out successfully!");
        navigate("/login");
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/students", label: "Students", icon: "🎓" },
        ...(user?.role === "admin"
            ? [{ path: "/audit-logs", label: "Audit Logs", icon: "📋" }]
            : []),
    ];

    return (
        <div className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <span className="sidebar-logo-icon">🎓</span>
                <span className="sidebar-logo-text">SMS</span>
            </div>

            {/* User Info */}
            <div className="sidebar-user-info">
                <div className="sidebar-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="sidebar-user-name">{user?.name}</p>
                    <p className="sidebar-user-role">{user?.role?.toUpperCase()}</p>
                </div>
            </div>

            {/* Nav Links */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
                        }
                    >
                        <span className="sidebar-nav-icon">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <button onClick={handleLogout} className="sidebar-logout-btn">
                🚪 Logout
            </button>
        </div>
    );
};

export default Sidebar;