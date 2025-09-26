// src/pages/MySubmissions.tsx
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
import { useHistory, useLocation } from "react-router";
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
  visits?: number;
}

const MySubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [userName, setUserName] = useState("");
  const history = useHistory();
  const location = useLocation<{ fromTakePicture?: boolean }>();

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setToastMsg("⚠️ Please login first");
          setShowToast(true);
          history.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();

        setUserName(
          profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            "User"
        );

        fetchApprovedSubmissions();
      } catch (err: any) {
        setUserName("User");
        setToastMsg(`Error: ${err.message}`);
        setShowToast(true);
        history.push("/login");
      }
    };

    checkUserAccess();
  }, [history]);

  // Refresh submissions automatically if returning from TakePicture page
  useEffect(() => {
    if (location.state?.fromTakePicture) {
      fetchApprovedSubmissions();
    }
  }, [location.state]);

  const fetchApprovedSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tree_submissions")
        .select("*")
        .ilike("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsedData =
        data?.map((sub: any) => {
          const exif = sub.exif_metadata ? JSON.parse(sub.exif_metadata) : null;
          const finalLat = exif?.latitude ?? sub.latitude;
          const finalLng = exif?.longitude ?? sub.longitude;

          return {
            ...sub,
            exif_metadata: exif,
            latitude: finalLat,
            longitude: finalLng,
            visits: sub.visits || 0,
          };
        }) || [];

      setSubmissions(parsedData);
    } catch (err: any) {
      setToastMsg(`Error fetching submissions: ${err.message}`);
      setShowToast(true);
    }
    setLoading(false);
  };

  const toDMS = (deg: number, type: "lat" | "lon") => {
    if (!deg) return "N/A";
    const d = Math.floor(Math.abs(deg));
    const m = Math.floor((Math.abs(deg) - d) * 60);
    const s = ((Math.abs(deg) - d - m / 60) * 3600).toFixed(2);
    const dir = type === "lat" ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
    return `${d}° ${m}' ${s}" ${dir}`;
  };

  const getDistanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const incrementVisits = async (submission: Submission) => {
    try {
      if ((submission.visits || 0) >= 5) return; // stop at 5 visits

      const newVisits = (submission.visits || 0) + 1;
      const { error } = await supabase
        .from("tree_submissions")
        .update({ visits: newVisits })
        .eq("submission_id", submission.submission_id);

      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.submission_id === submission.submission_id
            ? { ...s, visits: newVisits }
            : s
        )
      );
    } catch (err) {
      console.error("Error updating visits:", err);
    }
  };

  const handleFind = (submission: Submission) => {
    const { latitude: lat, longitude: lng } = submission;

    if (!lat || !lng) {
      setToastMsg("⚠️ Tree location not available");
      setShowToast(true);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          const distance = getDistanceMeters(userLat, userLng, lat, lng);

          if (distance <= 1) {
            setToastMsg("🎉 You are at the tree location! 🌳");
            setShowToast(true);
          }

          const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}`;
          window.open(mapsUrl, "_blank");

          incrementVisits(submission);
        },
        () => {
          setToastMsg("⚠️ Could not detect your location");
          setShowToast(true);

          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          window.open(mapsUrl, "_blank");

          incrementVisits(submission);
        }
      );
    } else {
      setToastMsg("⚠️ Geolocation not supported by this browser");
      setShowToast(true);

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(mapsUrl, "_blank");

      incrementVisits(submission);
    }
  };

  const handleRadar = (submission: Submission) => {
    history.push(`/radar/${submission.submission_id}`);
  };

  // ✅ Safe handleSubmitMonitoring
  const handleSubmitMonitoring = async (submission: Submission, imageUrl: string) => {
    if (!imageUrl) {
      setToastMsg("⚠️ Image URL is required to submit monitoring");
      setShowToast(true);
      return;
    }

    try {
      // Allowed status values (match PostgreSQL check constraint)
      const allowedStatuses = ["pending", "approved", "rejected"];
      const statusToUse = allowedStatuses[0]; // use 'pending' by default

      const { error: monitorError } = await supabase.from("tree_monitoring").insert([
        {
          submission_id: submission.submission_id,
          user_id: submission.user_id,
          latitude: submission.latitude,
          longitude: submission.longitude,
          image_url: imageUrl,
          monitored_at: new Date().toISOString(),
          status: statusToUse,
          notes: "",
        },
      ]);

      if (monitorError) throw monitorError;

      // Increment visits (max 5)
      if ((submission.visits || 0) < 5) {
        incrementVisits(submission);
        setToastMsg(`✅ Monitoring submitted! Visits: ${(submission.visits || 0) + 1}/5`);
      } else {
        setToastMsg("⚠️ This tree has reached maximum visits (5)");
      }
      setShowToast(true);
    } catch (err: any) {
      setToastMsg(`Error submitting monitoring: ${err.message}`);
      setShowToast(true);
    }
  };

  const handleTakePicture = (submission: Submission) => {
    // Navigate to TakePicture page
    history.push(`/take-picture/${submission.submission_id}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Approved Trees</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear"> 👤 {userName || "Loading..."} </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <IonSpinner name="crescent" />
        ) : submissions.length === 0 ? (
          <p>No approved tree submissions yet 🌱</p>
        ) : (
          submissions.map((sub) => (
            <IonCard key={sub.submission_id} style={{ padding: "16px" }}>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: "20px", fontWeight: "600" }}>
                  Approved Tree
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "16px",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {/* Image */}
                  {sub.image_url ? (
                    <IonImg
                      src={sub.image_url}
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        height: "auto",
                        borderRadius: "8px",
                        objectFit: "contain",
                        background: "#fafafa",
                        padding: "8px",
                      }}
                    />
                  ) : (
                    <p>📷 Image not available</p>
                  )}

                  {/* Tree Type */}
                  <p style={{ fontSize: "16px", fontWeight: "500", fontStyle: "italic" }}>
                    {sub.tree_type || "Planted a new tree"}
                  </p>

                  {/* Coordinates */}
                  <table style={{ width: "100%", fontSize: "14px" }}>
                    <tbody>
                      <tr>
                        <td>
                          <b>Latitude (DMS)</b>
                        </td>
                        <td>{toDMS(sub.latitude, "lat")}</td>
                      </tr>
                      <tr>
                        <td>
                          <b>Longitude (DMS)</b>
                        </td>
                        <td>{toDMS(sub.longitude, "lon")}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <IonButton expand="block" color="success">
                      👣 Visits: {sub.visits || 0}/5
                    </IonButton>
                    <IonButton expand="block" color="tertiary" onClick={() => handleFind(sub)}>
                      📍 Location
                    </IonButton>
                    <IonButton expand="block" color="warning" onClick={() => handleRadar(sub)}>
                      🧭 Radar
                    </IonButton>
                    <IonButton
                      expand="block"
                      color="primary"
                      disabled={(sub.visits || 0) >= 5}
                      onClick={() => handleTakePicture(sub)}
                    >
                      📸 Take Picture {(sub.visits || 0) >= 5 ? "(Max visits reached)" : ""}
                    </IonButton>
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

export default MySubmissions;
