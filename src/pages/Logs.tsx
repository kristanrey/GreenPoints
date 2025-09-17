import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonToast,
  IonRow,
  IonCol,
  IonGrid,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface Log {
  logs_id: string;
  user_id: string;
  email: string;
  action: string;
  created_at: string;
  logout_time: string | null;
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching logs:", error);
      setFeedback("Failed to load logs.");
      setShowToast(true);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  };

  // Helper: format duration
  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "—";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;

    if (diff <= 0) return "—";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <IonPage>   
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>User Logs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center">
            <IonSpinner name="crescent" />
            <p>Loading logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <IonCard>
            <IonCardContent>
              <IonGrid>
                <IonRow className="ion-text-bold">
                  <IonCol size="2">Email</IonCol>
                  <IonCol size="2">Action</IonCol>
                  <IonCol size="2">Login Time</IonCol>
                  <IonCol size="2">Logout Time</IonCol>
                  <IonCol size="2">Duration</IonCol>
                  <IonCol size="2">ID</IonCol>
                </IonRow>
                {logs.map((log) => (
                  <IonRow key={log.logs_id}>
                    <IonCol size="2">{log.email}</IonCol>
                    <IonCol size="2">{log.action}</IonCol>
                    <IonCol size="2">
                      {new Date(log.created_at).toLocaleString()}
                    </IonCol>
                    <IonCol size="2">
                      {log.logout_time
                        ? new Date(log.logout_time).toLocaleString()
                        : "—"}
                    </IonCol>
                    <IonCol size="2">
                      {formatDuration(log.created_at, log.logout_time)}
                    </IonCol>
                    <IonCol size="2">{log.logs_id.slice(0, 6)}…</IonCol>
                  </IonRow>
                ))}
              </IonGrid>
            </IonCardContent>
          </IonCard>
        ) : (
          <p className="ion-text-center">No logs found.</p>
        )}

        <IonToast
          isOpen={showToast}
          message={feedback}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminLogs;
