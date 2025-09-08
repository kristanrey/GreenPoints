// src/pages/ValidatePage.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonToast,
  IonSpinner,
  IonImg,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface Submission {
  submission_id: number; // FIXED: should be number (serial int)
  user_id: string;
  image_url: string;
  tree_type: string;
  date_planted: string;
  location_description: string;
  latitude: number;
  longitude: number;
  status: string;
}

const ValidatePage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Fetch pending submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tree_submissions")
        .select("*")
        .eq("status", "pending")
        .order("date_planted", { ascending: false });

      if (error) {
        console.error("Fetch submissions error:", error);
        setToastMsg(`Error fetching submissions: ${error.message}`);
        setShowToast(true);
      } else {
        setSubmissions(data as Submission[]);
      }
    } catch (err: any) {
      console.error("Unexpected fetch error:", err);
      setToastMsg(`Unexpected error: ${err.message || err}`);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Approve or Reject submission
  const handleAction = async (
    submission_id: number,
    status: "approved" | "rejected"
  ) => {
    try {
      console.log("Attempting action:", { submission_id, status });

      const submission = submissions.find((s) => s.submission_id === submission_id);
      if (!submission) {
        setToastMsg("❌ Submission not found");
        setShowToast(true);
        return;
      }

      if (status === "approved") {
        // 1️⃣ Update tree_submissions (set approved + 30 points)
        const { error: updateError } = await supabase
          .from("tree_submissions")
          .update({ status: "approved", greenpoints: 30 })
          .eq("submission_id", submission_id);

        if (updateError) {
          console.error("Update error:", updateError);
          setToastMsg(`❌ Action failed: ${updateError.message}`);
          setShowToast(true);
          return;
        }

        // 2️⃣ Increment user profile totals
        const { error: profileError } = await supabase.rpc(
          "increment_profile_stats",
          {
            p_user_id: submission.user_id,
            p_points: 30,
            p_trees: 1,
          }
        );

        if (profileError) {
          console.error("Profile update error:", profileError);
          setToastMsg(`❌ Failed to update profile: ${profileError.message}`);
          setShowToast(true);
          return;
        }

        setToastMsg("✅ Approved (+30 GreenPoints)");
      } else {
        // Rejected → mark submission as rejected with 0 points
        const { error: rejectError } = await supabase
          .from("tree_submissions")
          .update({ status: "rejected", greenpoints: 0 })
          .eq("submission_id", submission_id);

        if (rejectError) {
          console.error("Reject error:", rejectError);
          setToastMsg(`❌ Action failed: ${rejectError.message}`);
          setShowToast(true);
          return;
        }

        setToastMsg("❌ Rejected");
      }

      setShowToast(true);

      // Refresh list
      fetchSubmissions();
    } catch (err: any) {
      console.error("Unexpected error in handleAction:", err);
      setToastMsg(`❌ Unexpected error: ${err.message || err}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" color="medium" routerLink="/GreenPoints/validators">
            ← Go Back
          </IonButton>
          <IonTitle>Validate Trees</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <IonSpinner name="crescent" />
        ) : submissions.length === 0 ? (
          <p>No pending submissions 🎉</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f1f1" }}>
                  <th style={{ padding: "8px" }}>Photo</th>
                  <th style={{ padding: "8px" }}>Tree</th>
                  <th style={{ padding: "8px" }}>Date Planted</th>
                  <th style={{ padding: "8px" }}>Location</th>
                  <th style={{ padding: "8px" }}>Coordinates</th>
                  <th style={{ padding: "8px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.submission_id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "8px" }}>
                      <IonImg
                        src={sub.image_url}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>{sub.tree_type}</td>
                    <td style={{ padding: "8px" }}>{sub.date_planted}</td>
                    <td style={{ padding: "8px" }}>{sub.location_description}</td>
                    <td style={{ padding: "8px" }}>
                      {sub.latitude.toFixed(5)}, {sub.longitude.toFixed(5)}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <IonButton
                          size="small"
                          color="success"
                          onClick={() => handleAction(sub.submission_id, "approved")}
                        >
                          Approve
                        </IonButton>
                        <IonButton
                          size="small"
                          color="danger"
                          onClick={() => handleAction(sub.submission_id, "rejected")}
                        >
                          Reject
                        </IonButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ValidatePage;
