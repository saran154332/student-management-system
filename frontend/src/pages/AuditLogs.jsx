import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import API from "../api/axios";
import Layout from "../components/Layout";

const AuditLogs = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Redirect teacher away from this page
  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const res = await API.get("/audit");
      return res.data;
    },
    enabled: user?.role === "admin",
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <Layout>
      <h1 className="audit-title">Audit Logs 📋</h1>

      <div className="audit-table-wrapper">
        {isLoading ? (
          <div className="no-logs">Loading logs... ⏳</div>
        ) : logs?.length === 0 ? (
          <div className="no-logs">No audit logs found 😕</div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Performed By</th>
                <th>Role</th>
                <th>Student</th>
                <th>Details</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span className={`action-badge ${log.action}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.performedBy?.name || "—"}</td>
                  <td>{log.performedBy?.role?.toUpperCase() || "—"}</td>
                  <td>{log.studentId?.name || "—"}</td>
                  <td>{log.details}</td>
                  <td>{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default AuditLogs;