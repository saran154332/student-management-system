import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <Sidebar />
      <main className="layout-main">{children}</main>
    </div>
  );
};

export default Layout;