// src/pages/RadarPage.tsx
import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonToast, IonButton } from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

interface Submission {
  submission_id: number;
  latitude: number;
  longitude: number;
  tree_type: string;
}

const RadarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState("");

  // Get tree data
  useEffect(() => {
    const fetchSubmission = async () => {
      const { data, error } = await supabase
        .from("tree_submissions")
        .select("submission_id, latitude, longitude, tree_type")
        .eq("submission_id", id)
        .maybeSingle();

      if (error) {
        setToastMsg("⚠️ Failed to load tree");
        return;
      }
      setSubmission(data);
    };
    fetchSubmission();
  }, [id]);

  // Track user location
  useEffect(() => {
    if (!submission) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

        // Calculate bearing & distance
        const dist = getDistanceMeters(lat, lng, submission.latitude, submission.longitude);
        const brg = getBearing(lat, lng, submission.latitude, submission.longitude);
        setDistance(dist);
        setBearing(brg);
      },
      (err) => {
        setToastMsg("⚠️ Location error");
        console.error(err);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [submission]);

  // Haversine formula
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Bearing formula
  const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const toDeg = (v: number) => (v * 180) / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Radar</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ textAlign: "center" }}>
        {!submission || !userLat || !userLng ? (
          <IonSpinner name="crescent" />
        ) : (
          <>
            <h2>{submission.tree_type}</h2>
            <p>Distance: {(distance / 1).toFixed(1)} meters</p>
            <p>Bearing: {bearing.toFixed(1)}°</p>

            {/* Radar Canvas */}
            <div
              style={{
                margin: "20px auto",
                width: "250px",
                height: "250px",
                borderRadius: "50%",
                border: "3px solid green",
                position: "relative",
              }}
            >
              {/* Arrow pointing to tree */}
              <div
                style={{
                  width: "4px",
                  height: "100px",
                  background: "red",
                  position: "absolute",
                  top: "25px",
                  left: "50%",
                  transform: `translateX(-50%) rotate(${bearing}deg)`,
                  transformOrigin: "bottom center",
                }}
              ></div>
            </div>

            <IonButton expand="block" onClick={() => history.goBack()}>
              🔙 Back
            </IonButton>
          </>
        )}

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setToastMsg("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default RadarPage;
