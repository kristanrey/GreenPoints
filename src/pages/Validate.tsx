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
  IonButtons,
} from "@ionic/react";
import { useHistory } from "react-router";
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
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [validatorName, setValidatorName] = useState("");
  const history = useHistory();

  // ✅ Check validator access
  useEffect(() => {
    const checkValidatorAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setToastMsg("⚠️ Please login as validator");
          setShowToast(true);
          history.push("/validators-login");
          return;
        }

        // Fetch validator info
        const { data: validator, error } = await supabase
          .from("validators")
          .select("validator_id, full_name")
          .eq("validator_id", user.id)
          .single();

        if (error || !validator) {
          setToastMsg("❌ Access denied: You are not a validator");
          setShowToast(true);
          history.push("/validators-login");
          return;
        }

        setValidatorName(validator.full_name);

        // Load submissions after validator check
        fetchSubmissions();
      } catch (err: any) {
        setToastMsg(`Error: ${err.message}`);
        setShowToast(true);
        history.push("/validators-login");
      }
    };

    checkValidatorAccess();
  }, [history]);

  // 🔄 Fetch only pending submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tree_submissions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setToastMsg(`Error fetching submissions: ${error.message}`);
      setShowToast(true);
    } else {
      setSubmissions(data as Submission[]);
    }
    setLoading(false);
  };

  // 🟢 Approve / ❌ Reject action (Updated: auto +30 points, accurate trees_planted)
  const handleAction = async (
    submission_id: number,
    status: "approved" | "rejected"
  ) => {
    try {
      // 1. Update submission status only
     const { data: updated, error: submissionError } = await supabase
  .from("tree_submissions")
  .update({ status })
  .eq("submission_id", submission_id)
  .select("user_id")
  .maybeSingle(); // <-- safer than .single()

      if (submissionError) throw submissionError;

      if (status === "approved" && updated?.user_id) {
        // Fetch current profile stats
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("greenpoints")
          .eq("user_id", updated.user_id)
          .single();

        if (fetchError) throw fetchError;

        // Count all approved submissions for this user
        const { count: approvedCount, error: countError } = await supabase
          .from("tree_submissions")
          .select("submission_id", { count: "exact", head: true })
          .eq("user_id", updated.user_id)
          .eq("status", "approved");

        if (countError) throw countError;

        // Update profile: greenpoints +30, trees_planted = total approved submissions
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            greenpoints: (profile?.greenpoints || 0) + 30,
            trees_planted: approvedCount || 1,
          })
          .eq("user_id", updated.user_id);

        if (profileError) throw profileError;
      }

      setToastMsg(
        status === "approved"
          ? "✅ Approved (+30 GreenPoints)"
          : "❌ Rejected"
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
          <IonButton
            slot="start"
            color="medium"
            routerLink="/GreenPoints/validators"
          >
            ← Go Back
          </IonButton>
          <IonTitle>Validate Trees</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear">
              👤 {validatorName || "Loading..."}
            </IonButton>
          </IonButtons>
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
                <IonCardTitle style={{ fontSize: "20px", fontWeight: "600" }}>
                  Tree Submission
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Left: Tree photo + buttons */}
                  <div style={{ textAlign: "center" }}>
                    <IonImg
                      src={sub.image_url}
                      style={{
                        width: "100%",
                        height: "auto",
                        maxWidth: "100%",
                        maxHeight: "400px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        background: "#fafafa",
                        padding: "8px",
                      }}
                    />

                    <p style={{ marginTop: "8px", fontStyle: "italic" }}>
                      {sub.tree_type || "Planted a new tree"}
                    </p>
                    {sub.status === "pending" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "12px",
                          justifyContent: "center",
                        }}
                      >
                        <IonButton
                          expand="block"
                          color="success"
                          onClick={() =>
                            handleAction(sub.submission_id, "approved")
                          }
                        >
                          Approve
                        </IonButton>
                        <IonButton
                          expand="block"
                          color="medium"
                          onClick={() =>
                            handleAction(sub.submission_id, "rejected")
                          }
                        >
                          Reject
                        </IonButton>
                      </div>
                    )}
                  </div>

                  {/* Right: EXIF Metadata */}
                  <div
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <h4 style={{ marginBottom: "12px", fontWeight: "600" }}>
                      EXIF Metadata
                    </h4>
                    <table style={{ width: "100%", fontSize: "14px" }}>
                      <tbody>
                        <tr>
                          <td>
                            <b>Date taken</b>
                          </td>
                          <td>
                            {sub.exif_metadata?.DateTimeOriginal ||
                              sub.date_planted}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <b>Device</b>
                          </td>
                          <td>
                            {sub.exif_metadata?.Make}{" "}
                            {sub.exif_metadata?.Model}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <b>GPS</b>
                          </td>
                          <td>
                            {sub.latitude}, {sub.longitude}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <b>Orientation</b>
                          </td>
                          <td>{sub.exif_metadata?.Orientation || "N/A"}</td>
                        </tr>
                        <tr>
                          <td>
                            <b>Exif version</b>
                          </td>
                          <td>{sub.exif_metadata?.ExifVersion || "N/A"}</td>
                        </tr>
                        <tr>
                          <td>
                            <b>Latitude</b>
                          </td>
                          <td>{toDMS(sub.latitude, "lat")}</td>
                        </tr>
                        <tr>
                          <td>
                            <b>Longitude</b>
                          </td>
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
