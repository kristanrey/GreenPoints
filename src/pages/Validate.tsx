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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface Submission {
  submission_id: number;
  user_id: string;
  image_url: string;
  tree_type: string;
  date_planted: string;
  location_description: string;
  latitude: number;
  longitude: number;
  status: string;
  exif_metadata?: any;
}

const ValidatePage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Fetch submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tree_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setToastMsg(`Error fetching: ${error.message}`);
      setShowToast(true);
    } else {
      setSubmissions(data as Submission[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleAction = async (
    submission_id: number,
    status: "approved" | "rejected"
  ) => {
    try {
      const update = await supabase
        .from("tree_submissions")
        .update({ status, greenpoints: status === "approved" ? 30 : 0 })
        .eq("submission_id", submission_id);

      if (update.error) throw update.error;

      setToastMsg(
        status === "approved" ? "✅ Approved (+30 GreenPoints)" : "❌ Rejected"
      );
      setShowToast(true);
      fetchSubmissions();
    } catch (err: any) {
      setToastMsg(`Error: ${err.message}`);
      setShowToast(true);
    }
  };

  // Helper: convert decimal to DMS
  const toDMS = (deg: number, type: "lat" | "lon") => {
    if (!deg) return "N/A";
    const d = Math.floor(Math.abs(deg));
    const m = Math.floor((Math.abs(deg) - d) * 60);
    const s = ((Math.abs(deg) - d - m / 60) * 3600).toFixed(2);
    const dir =
      type === "lat" ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
    return `${d}° ${m}' ${s}" ${dir}`;
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
          submissions.map((sub) => (
            <IonCard key={sub.submission_id} style={{ padding: "16px" }}>
              <IonCardHeader>
                <IonCardTitle>Tree Submission</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    alignItems: "start",
                  }}
                >
                  {/* Left: Tree photo + buttons */}
                  <div style={{ textAlign: "center" }}>
                    <IonImg
                      src={sub.image_url}
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        marginBottom: "8px",
                      }}
                    />
                    <p>Planted a new tree</p>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <IonButton
                        color="success"
                        onClick={() => handleAction(sub.submission_id, "approved")}
                      >
                        Approve
                      </IonButton>
                      <IonButton
                        color="medium"
                        onClick={() => handleAction(sub.submission_id, "rejected")}
                      >
                        Reject
                      </IonButton>
                    </div>
                  </div>

                  {/* Right: EXIF Metadata */}
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <h4 style={{ marginBottom: "12px" }}>EXIF Metadata</h4>
                    <table style={{ width: "100%", fontSize: "14px" }}>
                      <tbody>
                        <tr>
                          <td><b>Date taken</b></td>
                          <td>
                            {sub.exif_metadata?.DateTimeOriginal ||
                              sub.date_planted}
                          </td>
                        </tr>
                        <tr>
                          <td><b>Device</b></td>
                          <td>
                            {sub.exif_metadata?.Make}{" "}
                            {sub.exif_metadata?.Model}
                          </td>
                        </tr>
                        <tr>
                          <td><b>GPS</b></td>
                          <td>
                            {sub.latitude}, {sub.longitude}
                          </td>
                        </tr>
                        <tr>
                          <td><b>Orientation</b></td>
                          <td>{sub.exif_metadata?.Orientation || "N/A"}</td>
                        </tr>
                        <tr>
                          <td><b>Exif version</b></td>
                          <td>{sub.exif_metadata?.ExifVersion || "N/A"}</td>
                        </tr>
                        <tr>
                          <td><b>Latitude</b></td>
                          <td>{toDMS(sub.latitude, "lat")}</td>
                        </tr>
                        <tr>
                          <td><b>Longitude</b></td>
                          <td>{toDMS(sub.longitude, "lon")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          ))
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
