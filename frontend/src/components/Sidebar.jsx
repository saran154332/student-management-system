import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../app/authSlice";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

const Sidebar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("theme", theme);
    }, [theme]);

    const handleLogout = () => {
        dispatch(logout());
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: "DB" },
        { path: "/students", label: "Students", icon: "ST" },
        ...(user?.role === "admin"
            ? [{ path: "/audit-logs", label: "Audit Logs", icon: "AL" }]
            : []),
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div>
                    <span className="sidebar-logo-text">StudentMS</span>
                    <span className="sidebar-logo-subtitle">School operations</span>
                </div>
            </div>

            <div className="sidebar-user-info">
                <div className="sidebar-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="sidebar-user-name">{user?.name}</p>
                    <p className="sidebar-user-role">{user?.role?.toUpperCase()}</p>
                </div>
            </div>

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

            <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
                aria-label="Toggle theme"
            >
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                <span className="theme-toggle-track">
                    <span className="theme-toggle-thumb" />
                </span>
            </button>

            <button onClick={handleLogout} className="sidebar-logout-btn">
                Logout
            </button>
        </aside>
    );
};

export default Sidebar;
