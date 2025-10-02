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

const StatisticsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [monitoring, setMonitoring] = useState<Monitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All");
  const [selectedCondition, setSelectedCondition] = useState<string>("All");

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
    const barangayMatch = true; // keep monitoring global if no barangay
    const conditionMatch =
      selectedCondition === "All" || m.condition === selectedCondition;
    return barangayMatch && conditionMatch;
  });

  // 1. Bar Graph: Submissions per Barangay
  const barangayCount = filteredSubmissions.reduce((acc: any, s) => {
    acc[s.barangay] = (acc[s.barangay] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(barangayCount).map(([barangay, count]) => ({
    barangay,
    count,
  }));

  // 2. Histogram: Distribution of GreenPoints
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

  // 3. Line Graph: Submissions over Time (monthly)
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

  // 4. Pie Chart: Tree Conditions (Filtered)
  const conditionCount = filteredMonitoring.reduce((acc: any, m) => {
    acc[m.condition] = (acc[m.condition] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(conditionCount).map(([cond, count]) => ({
    name: cond,
    value: count,
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];
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
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
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
