import { useQuery } from "@tanstack/react-query";
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

const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await API.get("/students/dashboard/stats");
      return res.data;
    },
  });

  if (isLoading)
    return (
      <Layout>
        <div className="dashboard-loading">Loading dashboard... ⏳</div>
      </Layout>
    );

  const genderData = [
    { name: "Male", value: data?.genderStats?.male || 0 },
    { name: "Female", value: data?.genderStats?.female || 0 },
    { name: "Other", value: data?.genderStats?.other || 0 },
  ];

  return (
    <Layout>
      <h1 className="dashboard-title">Dashboard 📊</h1>

      {/* Stats Cards */}
      <div className="dashboard-cards-row">
        <div className="dashboard-card purple">
          <div className="dashboard-card-icon">🎓</div>
          <div>
            <p className="dashboard-card-label">Total Students</p>
            <p className="dashboard-card-value">{data?.totalStudents || 0}</p>
          </div>
        </div>

        <div className="dashboard-card pink">
          <div className="dashboard-card-icon">👦</div>
          <div>
            <p className="dashboard-card-label">Male Students</p>
            <p className="dashboard-card-value">{data?.genderStats?.male || 0}</p>
          </div>
        </div>

        <div className="dashboard-card blue">
          <div className="dashboard-card-icon">👧</div>
          <div>
            <p className="dashboard-card-label">Female Students</p>
            <p className="dashboard-card-value">{data?.genderStats?.female || 0}</p>
          </div>
        </div>

        <div className="dashboard-card green">
          <div className="dashboard-card-icon">🏫</div>
          <div>
            <p className="dashboard-card-label">Total Classes</p>
            <p className="dashboard-card-value">{data?.totalClasses || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-charts-row">
        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">Gender Ratio</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
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

        <div className="dashboard-chart-card">
          <h3 className="dashboard-chart-title">Students per Class</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.classStats || []}>
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#667eea" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;