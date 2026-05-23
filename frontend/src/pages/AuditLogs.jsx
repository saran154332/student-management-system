import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import API from "../api/axios";
import Layout from "../components/Layout";

const AuditLogs = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

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

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

  return (
    <Layout>
      <div className="page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Admin controls</p>
            <h1>Audit Logs</h1>
            <p>Track changes made to student records and administrative actions.</p>
          </div>
        </div>

        <div className="table-panel">
          {isLoading ? (
            <div className="panel">
              {[1, 2, 3, 4].map((item) => (
                <div className="student-row-skeleton" key={item}>
                  <div className="skeleton skeleton-pill" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line" />
                </div>
              ))}
            </div>
          ) : logs?.length === 0 ? (
            <div className="empty-state">No audit logs found</div>
          ) : (
            <table className="data-table">
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
                    <td>{log.performedBy?.name || "-"}</td>
                    <td>{log.performedBy?.role?.toUpperCase() || "-"}</td>
                    <td>{log.studentId?.name || "-"}</td>
                    <td>{log.details}</td>
                    <td>{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogs;
