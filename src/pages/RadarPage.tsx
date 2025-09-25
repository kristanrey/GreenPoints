// src/pages/RadarPage.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonToast,
  IonButton,
} from "@ionic/react";
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngle = useRef(0);

  // Fetch tree
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

  // Track user
  useEffect(() => {
    if (!submission) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

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

  // Radar drawing loop
  useEffect(() => {
    if (!canvasRef.current || !submission || !userLat || !userLng) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radius = canvas.width / 2;
    const centerX = radius;
    const centerY = radius;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radar background
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid circles
      ctx.strokeStyle = "rgba(0,255,0,0.3)";
      ctx.lineWidth = 1;
      for (let r = radius / 4; r <= radius; r += radius / 4) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const sweepX = centerX + radius * Math.cos(sweepAngle.current);
      const sweepY = centerY + radius * Math.sin(sweepAngle.current);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 🔴 Draw user arrow at center pointing toward the tree
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((bearing * Math.PI) / 180); // rotate arrow to face tree
      ctx.beginPath();
      ctx.moveTo(0, -12); // tip
      ctx.lineTo(6, 8); // right wing
      ctx.lineTo(-6, 8); // left wing
      ctx.closePath();
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.restore();

      // 🟢 Draw tree dot (relative position)
      const brgRad = (bearing * Math.PI) / 180;
      const distNorm = Math.min(distance / 100, 1) * radius; // scale: max 100m = edge
      const dotX = centerX + distNorm * Math.cos(brgRad);
      const dotY = centerY + distNorm * Math.sin(brgRad);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "lime";
      ctx.fill();

      // Rotate sweep
      sweepAngle.current += 0.05;
      if (sweepAngle.current > Math.PI * 2) sweepAngle.current = 0;

      requestAnimationFrame(draw);
    };

    draw();
  }, [bearing, distance, submission, userLat, userLng]);

  // Distance
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

  // Bearing
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
            <p>Distance: {distance.toFixed(1)} m</p>
            <p>Bearing: {bearing.toFixed(1)}°</p>

            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              style={{
                display: "block",
                margin: "20px auto",
                background: "black",
                borderRadius: "50%",
              }}
            />

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
