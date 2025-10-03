// src/pages/StatisticsPage.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface Submission {
  created_at: string;
  status: string;
  barangay: string;
  greenpoints: number;
}

interface Monitoring {
  monitored_at: string;
  condition: string;
}

interface LogEntry {
  email: string;
  action: string;
  login_time: string;
}

const StatisticsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [monitoring, setMonitoring] = useState<Monitoring[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");
  const [logFilter, setLogFilter] = useState<string>("daily"); // daily | weekly

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // Fetch from tree_submissions
      const { data: subData, error: subError } = await supabase
        .from("tree_submissions")
        .select("created_at, status, barangay, greenpoints");
      if (subError) throw subError;
      setSubmissions(subData || []);

      // Fetch from tree_monitoring
      const { data: monData, error: monError } = await supabase
        .from("tree_monitoring")
        .select("monitored_at, condition");
      if (monError) throw monError;
      setMonitoring(monData || []);

      // Fetch from logs
      const { data: logData, error: logError } = await supabase
        .from("logs")
        .select("email, action, login_time");
      if (logError) throw logError;
      setLogs(logData || []);
    } catch (err: any) {
      console.error("Error fetching stats:", err.message);
    }
    setLoading(false);
  };

  // --- 📊 Filtered Data ---
  const filteredSubmissions =
    selectedBarangay === "All"
      ? submissions
      : submissions.filter((s) => s.barangay === selectedBarangay);

  const filteredMonitoring = monitoring.filter((m) => {
    const conditionMatch =
      selectedCondition === "All" || m.condition === selectedCondition;
    return conditionMatch;
  });

  // --- Bar Graph: Submissions per Barangay ---
  const barangayCount = filteredSubmissions.reduce((acc: any, s) => {
    acc[s.barangay] = (acc[s.barangay] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(barangayCount).map(([barangay, count]) => ({
    barangay,
    count,
  }));

  // --- Histogram: GreenPoints Distribution ---
  const histBins: { [key: string]: number } = {};
  filteredSubmissions.forEach((s) => {
    const rangeStart = Math.floor(s.greenpoints / 10) * 10;
    const label = `${rangeStart}-${rangeStart + 9}`;
    histBins[label] = (histBins[label] || 0) + 1;
  });
  const histData = Object.entries(histBins).map(([range, count]) => ({
    range,
    count,
  }));

  // --- Line Graph: Submissions over Time ---
  const monthlySubmissions = filteredSubmissions.reduce((acc: any, s) => {
    const month = new Date(s.created_at).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const lineData = Object.entries(monthlySubmissions).map(([month, count]) => ({
    month,
    count,
  }));

  // --- Pie Chart: Tree Conditions ---
  const conditionCount = filteredMonitoring.reduce((acc: any, m) => {
    acc[m.condition] = (acc[m.condition] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(conditionCount).map(([cond, count]) => ({
    name: cond,
    value: count,
  }));

  // ✅ Condition colors
  const conditionColors: Record<string, string> = {
    growing: "#0088FE", // blue
    dying: "#FF0000", // red
    remove: "#00C49F", // green
  };

  // --- Logs: Group logins per day or week ---
  const logCounts: { [key: string]: number } = {};
  logs.forEach((log) => {
    if (log.action === "login") {
      const date = new Date(log.login_time);
      let key = "";

      if (logFilter === "daily") {
        key = date.toLocaleDateString("default", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } else if (logFilter === "weekly") {
        // group by week number
        const onejan = new Date(date.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((date.getTime() - onejan.getTime()) / 86400000 +
            onejan.getDay() +
            1) /
            7
        );
        key = `Week ${week}, ${date.getFullYear()}`;
      }

      logCounts[key] = (logCounts[key] || 0) + 1;
    }
  });

  const logData = Object.entries(logCounts).map(([period, count]) => ({
    period,
    count,
  }));

  const barangayList = Array.from(new Set(submissions.map((s) => s.barangay)));
  const conditionList = Array.from(new Set(monitoring.map((m) => m.condition)));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Statistics</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <IonSpinner name="dots" />
          </div>
        ) : (
          <>
            {/* 🔽 Filters */}
            <div style={{ padding: "1rem", display: "flex", gap: "1rem" }}>
              <IonItem style={{ flex: 1 }}>
                <IonLabel>Filter by Barangay</IonLabel>
                <IonSelect
                  value={selectedBarangay}
                  placeholder="Select Barangay"
                  onIonChange={(e) => setSelectedBarangay(e.detail.value)}
                >
                  <IonSelectOption value="All">All</IonSelectOption>
                  {barangayList.map((b, idx) => (
                    <IonSelectOption key={idx} value={b}>
                      {b}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem style={{ flex: 1 }}>
                <IonLabel>Filter by Condition</IonLabel>
                <IonSelect
                  value={selectedCondition}
                  placeholder="Select Condition"
                  onIonChange={(e) => setSelectedCondition(e.detail.value)}
                >
                  <IonSelectOption value="All">All</IonSelectOption>
                  {conditionList.map((c, idx) => (
                    <IonSelectOption key={idx} value={c}>
                      {c}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem style={{ flex: 1 }}>
                <IonLabel>Logins Filter</IonLabel>
                <IonSelect
                  value={logFilter}
                  placeholder="Select Log Filter"
                  onIonChange={(e) => setLogFilter(e.detail.value)}
                >
                  <IonSelectOption value="daily">Daily</IonSelectOption>
                  <IonSelectOption value="weekly">Weekly</IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>

            {/* 📊 Charts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                padding: "1rem",
              }}
            >
              {/* --- BAR GRAPH --- */}
              <div>
                <h3>Submissions per Barangay</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="barangay" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* --- HISTOGRAM --- */}
              <div>
                <h3>GreenPoints Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={histData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* --- LINE GRAPH --- */}
              <div>
                <h3>Submissions Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#d81b60" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* --- PIE CHART --- */}
              <div>
                <h3>Tree Conditions</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            conditionColors[entry.name.toLowerCase()] ||
                            "#A569BD"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* --- LOGIN LOGS BAR CHART --- */}
              <div>
                <h3>User Logins ({logFilter})</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={logData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#FF5733" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default StatisticsPage;
