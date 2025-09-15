// src/pages/LogsAdmin.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import "./LogsAdmin.css";

interface Profile {
  user_id: string;
  username: string;
  email: string;
  role: string;
  trees_planted: number;
  created_at: string;
  greenpoints: number;
}

const LogsAdmin: React.FC = () => {
  const [logs, setLogs] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setToastMsg("❌ Access denied. Please log in.");
        setShowToast(true);
        setLoading(false);
        return;
      }

      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select(
          "user_id, username, email, role, trees_planted, created_at, greenpoints"
        )
        .order("created_at", { ascending: false });

      if (usersError || !users) {
        setToastMsg("❌ No users found.");
        setShowToast(true);
        setLoading(false);
        return;
      }

      setLogs(users as Profile[]);
    } catch (err: any) {
      setToastMsg(`Error: ${err.message}`);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <IonPage>
      <IonHeader translucent={true}>
        <IonToolbar color="dark">
          <IonTitle>Admin Logs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="logs-page">
        {loading ? (
          <IonSpinner name="crescent" />
        ) : logs.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Trees Planted</th>
                <th>Greenpoints</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.trees_planted}</td>
                  <td>{user.greenpoints}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2500}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default LogsAdmin;
