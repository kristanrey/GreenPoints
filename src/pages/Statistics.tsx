import React, { useEffect, useRef, useState } from "react";
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
  IonButton,
  IonIcon,
} from "@ionic/react";
import { printOutline, refreshOutline, arrowBackOutline, downloadOutline } from "ionicons/icons";
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

// --- Interfaces ---
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

interface EventData {
  created_at: string;
  title: string;
}

// --- CSV Export Utility ---
const downloadCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${row[h]}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  link.click();
};

const StatisticsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [monitoring, setMonitoring] = useState<Monitoring[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");
  const [logFilter, setLogFilter] = useState<string>("daily");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const { data: subData, error: subError } = await supabase
        .from("tree_submissions")
        .select("created_at, status, barangay, greenpoints");
      if (subError) throw subError;
      setSubmissions(subData || []);

      const { data: monData, error: monError } = await supabase
        .from("tree_monitoring")
        .select("monitored_at, condition");
      if (monError) throw monError;
      setMonitoring(monData || []);

      const { data: logData, error: logError } = await supabase
        .from("logs")
        .select("email, action, login_time");
      if (logError) throw logError;
      setLogs(logData || []);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("created_at, title");
      if (eventError) throw eventError;
      setEvents(eventData || []);
    } catch (err: any) {
      console.error("Error fetching stats:", err.message);
    }
    setLoading(false);
  };

  // --- Filters ---
  const filteredSubmissions =
    selectedBarangay === "All"
      ? submissions
      : submissions.filter((s) => s.barangay === selectedBarangay);

  const filteredMonitoring =
    selectedCondition === "All"
      ? monitoring
      : monitoring.filter((m) => m.condition === selectedCondition);

  // --- Chart Data ---
  const barangayCount = filteredSubmissions.reduce((acc: any, s) => {
    acc[s.barangay] = (acc[s.barangay] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(barangayCount).map(([barangay, count]) => ({
    barangay,
    count,
  }));

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

  const conditionCount = filteredMonitoring.reduce((acc: any, m) => {
    acc[m.condition] = (acc[m.condition] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(conditionCount).map(([cond, count]) => ({
    name: cond,
    value: count,
  }));
  const conditionColors: Record<string, string> = {
    growing: "#00C49F",
    dying: "#FF8042",
    remove: "#FF0000",
  };

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
      } else {
        const onejan = new Date(date.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
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

  const eventCounts: { [key: string]: number } = {};
  events.forEach((e) => {
    const month = new Date(e.created_at).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    eventCounts[month] = (eventCounts[month] || 0) + 1;
  });
  const eventData = Object.entries(eventCounts).map(([month, count]) => ({
    month,
    count,
  }));

  const barangayList = Array.from(new Set(submissions.map((s) => s.barangay)));
  const conditionList = Array.from(new Set(monitoring.map((m) => m.condition)));

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.write(`
          <html>
            <head>
              <title>Statistics Report</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h3 { color: #006400; }
                .chart { margin-bottom: 2rem; }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        newWin.document.close();
        newWin.print();
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Statistics & Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <IonSpinner name="crescent" />
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div
              style={{
                padding: "1rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <IonItem style={{ flex: 1, minWidth: "200px" }}>
                  <IonLabel>Barangay</IonLabel>
                  <IonSelect
                    value={selectedBarangay}
                    onIonChange={(e) => setSelectedBarangay(e.detail.value)}
                  >
                    <IonSelectOption value="All">All</IonSelectOption>
                    {barangayList.map((b, i) => (
                      <IonSelectOption key={i} value={b}>
                        {b}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <IonItem style={{ flex: 1, minWidth: "200px" }}>
                  <IonLabel>Condition</IonLabel>
                  <IonSelect
                    value={selectedCondition}
                    onIonChange={(e) => setSelectedCondition(e.detail.value)}
                  >
                    <IonSelectOption value="All">All</IonSelectOption>
                    {conditionList.map((c, i) => (
                      <IonSelectOption key={i} value={c}>
                        {c}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <IonItem style={{ flex: 1, minWidth: "200px" }}>
                  <IonLabel>Login Filter</IonLabel>
                  <IonSelect
                    value={logFilter}
                    onIonChange={(e) => setLogFilter(e.detail.value)}
                  >
                    <IonSelectOption value="daily">Daily</IonSelectOption>
                    <IonSelectOption value="weekly">Weekly</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <IonButton color="medium" fill="outline" onClick={fetchStatistics}>
                  <IonIcon icon={refreshOutline} slot="start" />
                  Refresh
                </IonButton>

                <IonButton color="success" fill="outline" onClick={handlePrint}>
                  <IonIcon icon={printOutline} slot="start" />
                  Print Report
                </IonButton>

                <IonButton
                  color="danger"
                  fill="outline"
                  href="/GreenPoints/EventDashboard"
                >
                  <IonIcon icon={arrowBackOutline} slot="start" />
                  Back
                </IonButton>
              </div>
            </div>

            {/* Charts Section */}
            <div
              ref={printRef}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "1.5rem",
                padding: "1rem",
              }}
            >
              <ChartCard
                title="Submissions per Barangay"
                csvData={filteredSubmissions}
                csvFilename="submissions.csv"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="barangay" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#28a745" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="GreenPoints Distribution"
                csvData={filteredSubmissions}
                csvFilename="greenpoints_distribution.csv"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={histData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Submissions Over Time"
                csvData={filteredSubmissions}
                csvFilename="submissions_over_time.csv"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#d81b60" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Tree Conditions"
                csvData={filteredMonitoring}
                csvFilename="tree_conditions.csv"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      label
                      outerRadius={80}
                      cx="50%"
                      cy="50%"
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={i}
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
              </ChartCard>

              <ChartCard
                title={`User Logins (${logFilter})`}
                csvData={logs}
                csvFilename="user_logins.csv"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={logData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FF5733" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Events Created Over Time"
                csvData={events}
                csvFilename="events_over_time.csv"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={eventData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#007bff" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

// Chart wrapper with CSV button
interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  csvData?: any[];
  csvFilename?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, csvData, csvFilename }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      padding: "1rem",
      position: "relative",
    }}
  >
    <h3 style={{ textAlign: "center", marginBottom: "1rem", color: "#006400" }}>
      {title}
    </h3>

    {/* CSV Download Button */}
    {csvData && csvFilename && (
      <IonButton
        size="small"
        fill="outline"
        color="primary"
        style={{ position: "absolute", top: "10px", right: "10px" }}
        onClick={() => downloadCSV(csvData, csvFilename)}
      >
        <IonIcon icon={downloadOutline} slot="start" />
        CSV
      </IonButton>
    )}

    <div className="chart">{children}</div>
  </div>
);

export default StatisticsPage;
