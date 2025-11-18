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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
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
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");

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
              {/* Submissions per Barangay */}
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

              {/* Tree Conditions */}
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
                          fill={conditionColors[entry.name.toLowerCase()] || "#A569BD"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

// --- ChartCard Component ---
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
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <h3 style={{ margin: 0, color: "#006400", fontSize: "1.1rem" }}>{title}</h3>
      {csvData && csvFilename && (
        <IonButton
          size="small"
          fill="clear"
          color="primary"
          onClick={() => downloadCSV(csvData, csvFilename)}
          style={{ fontSize: "0.8rem" }}
        >
          <IonIcon icon={downloadOutline} slot="start" />
          Export
        </IonButton>
      )}
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

export default StatisticsPage;
