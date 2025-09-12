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
  avatar_url?: string;
}

interface TreeSubmission {
  submission_id: number;
  user_id: string;
  image_url: string;
  status: string;
  tree_type?: string;
  date_planted?: string;
  location_description?: string;
  greenpoints?: number;
}

const LogsAdmin: React.FC = () => {
  const [logs, setLogs] = useState<Profile[]>([]);
  const [submissions, setSubmissions] = useState<TreeSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [showToast, setShowToast] = useState<boolean>(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Get logged-in user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setToastMsg("❌ Access denied. Please log in.");
        setShowToast(true);
        setLoading(false);
        return;
      }

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("user_id, username, email, role, trees_planted, created_at, greenpoints")
        .order("created_at", { ascending: false });

      if (usersError || !users) {
        setToastMsg("❌ No users found.");
        setShowToast(true);
        setLoading(false);
        return;
      }

      setLogs(users as Profile[]);

      // Fetch all submissions
      const { data: subs } = await supabase
        .from("tree_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      setSubmissions(subs as TreeSubmission[] || []);
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
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Logs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
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
                <React.Fragment key={user.user_id}>
                  <tr>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.trees_planted}</td>
                    <td>{user.greenpoints}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                  {submissions
                    .filter((s) => s.user_id === user.user_id)
                    .map((sub) => (
                      <tr key={sub.submission_id} className="submission-row">
                        <td colSpan={6}>
                          <div className="submission-container">
                            <img
                              src={sub.image_url}
                              alt="Tree"
                              className="submission-img"
                            />
                            <div className="submission-info">
                              <p><b>Tree Type:</b> {sub.tree_type || "N/A"}</p>
                              <p><b>Status:</b> {sub.status}</p>
                              <p><b>Date Planted:</b> {sub.date_planted || "N/A"}</p>
                              <p><b>Location:</b> {sub.location_description || "N/A"}</p>
                              <p><b>GreenPoints:</b> {sub.greenpoints || 0}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
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
