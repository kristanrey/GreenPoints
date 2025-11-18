// src/pages/UserLogs.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface LogEntry {
  logs_id: string;
  user_id: string;
  email: string;
  action: string;
  login_time: string;
  logout_time: string | null;
}

const UserLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchLatestLogsPerUser();
  }, []);

  useEffect(() => {
    applyFilter(filter);
  }, [logs, filter]);

  // ✅ Fetch latest log entry per user
  const fetchLatestLogsPerUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .order("login_time", { ascending: false });

      if (error) throw error;

      // Keep only latest log per unique email
      const latestLogsMap = new Map<string, LogEntry>();
      for (const log of data || []) {
        if (!latestLogsMap.has(log.email)) {
          latestLogsMap.set(log.email, log);
        }
      }

      const uniqueLatestLogs = Array.from(latestLogsMap.values());
      setLogs(uniqueLatestLogs);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter function
  const applyFilter = (filterType: string) => {
    const now = new Date();
    let filtered = [...logs];

    if (filterType === "today") {
      filtered = logs.filter((log) => {
        const logDate = new Date(log.login_time);
        return (
          logDate.toDateString() === now.toDateString()
        );
      });
    }

    if (filterType === "week") {
      filtered = logs.filter((log) => {
        const logDate = new Date(log.login_time);
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      });
    }

    if (filterType === "month") {
      filtered = logs.filter((log) => {
        const logDate = new Date(log.login_time);
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      });
    }

    setFilteredLogs(filtered);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>User Activity Logs (Latest per User)</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* ✅ Filter UI */}
        <IonItem>
          <IonLabel>Filter by Last Login:</IonLabel>
          <IonSelect
            value={filter}
            onIonChange={(e) => setFilter(e.detail.value)}
          >
            <IonSelectOption value="all">All</IonSelectOption>
            <IonSelectOption value="today">Today</IonSelectOption>
            <IonSelectOption value="week">Last 7 Days</IonSelectOption>
            <IonSelectOption value="month">Last 30 Days</IonSelectOption>
          </IonSelect>
        </IonItem>

        {loading ? (
          <div style={{ textAlign: "center", marginTop: "50%" }}>
            <IonSpinner name="crescent" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <IonText color="medium">
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              No logs found for this filter.
            </p>
          </IonText>
        ) : (
          <div
            style={{
              overflowX: "auto",
              background: "white",
              borderRadius: "12px",
              padding: "10px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead style={{ backgroundColor: "#4CAF50", color: "white" }}>
                <tr>
                  <th style={{ padding: "8px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "8px" }}>Email</th>
                  <th style={{ padding: "8px" }}>Action</th>
                  <th style={{ padding: "8px" }}>Last Login Time</th>
                  <th style={{ padding: "8px" }}>Last Logout Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr
                    key={log.logs_id}
                    style={{
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}
                  >
                    <td style={{ padding: "8px" }}>{index + 1}</td>
                    <td style={{ padding: "8px" }}>{log.email}</td>
                    <td style={{ padding: "8px" }}>{log.action}</td>
                    <td style={{ padding: "8px" }}>
                      {new Date(log.login_time).toLocaleString()}
                    </td>
                    <td style={{ padding: "8px" }}>
                      {log.logout_time
                        ? new Date(log.logout_time).toLocaleString()
                        : "Still Active / Not Logged Out"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default UserLogs;
