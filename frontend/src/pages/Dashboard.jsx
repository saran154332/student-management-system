import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import API from "../api/axios";
import Layout from "../components/Layout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#0f766e", "#10b981", "#1e3a8a"];

const DashboardSkeleton = () => (
  <Layout>
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line short" />
        </div>
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="metric-card" key={item}>
            <div className="skeleton skeleton-icon" />
            <div className="metric-content">
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-value" />
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="panel skeleton-panel" />
        <div className="panel skeleton-panel" />
      </div>
    </div>
  </Layout>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await API.get("/students/dashboard/stats");
      return res.data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["auditLogs", "dashboard"],
    queryFn: async () => {
      const res = await API.get("/audit");
      return res.data;
    },
    enabled: user?.role === "admin",
  });

  if (isLoading) return <DashboardSkeleton />;

  const totalStudents = data?.totalStudents || 0;
  const maleStudents = data?.genderStats?.male || 0;
  const femaleStudents = data?.genderStats?.female || 0;
  const totalClasses = data?.totalClasses || 0;

  const genderData = [
    { name: "Male", value: maleStudents },
    { name: "Female", value: femaleStudents },
    { name: "Other", value: data?.genderStats?.other || 0 },
  ];

  const recentActivity = user?.role === "admin"
    ? logs.slice(0, 5).map((log) => ({
        title: `${log.action?.toLowerCase()} student record`,
        detail: log.details || log.studentId?.name || "Student activity",
        meta: new Date(log.createdAt).toLocaleString(),
      }))
    : [
        { title: "Student directory ready", detail: `${totalStudents} records available`, meta: "Today" },
        { title: "Classes tracked", detail: `${totalClasses} active classes`, meta: "Live stats" },
        { title: "Role access", detail: "Teacher permissions enabled", meta: "Secure" },
      ];

  return (
    <Layout>
      <div className="page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h1>Dashboard</h1>
            <p>Live student operations, class distribution, and recent system activity.</p>
          </div>
          <div className="header-chip">{user?.role?.toUpperCase()} PORTAL</div>
        </div>

        <div className="stats-grid">
          <div className="metric-card">
            <span className="metric-icon navy">ST</span>
            <div className="metric-content">
              <p>Total Students</p>
              <h2>{totalStudents}</h2>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon emerald">M</span>
            <div className="metric-content">
              <p>Male Students</p>
              <h2>{maleStudents}</h2>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon amber">F</span>
            <div className="metric-content">
              <p>Female Students</p>
              <h2>{femaleStudents}</h2>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon teal">CL</span>
            <div className="metric-content">
              <p>Total Classes</p>
              <h2>{totalClasses}</h2>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Analytics</p>
                <h3>Gender Ratio</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Classes</p>
                <h3>Students per Class</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.classStats || []}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Activity</p>
              <h3>Recent Activity</h3>
            </div>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? recentActivity.map((item, index) => (
              <div className="activity-item" key={`${item.title}-${index}`}>
                <span className="activity-dot" />
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.detail}</p>
                </div>
                <span>{item.meta}</span>
              </div>
            )) : (
              <div className="empty-state">No recent activity yet</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
