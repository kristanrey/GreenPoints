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
import Radar from "radar-sdk-js";

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
  const [heading, setHeading] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState("");
  const [user, setUser] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngle = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beepInterval = useRef<NodeJS.Timeout | null>(null);

  // ✅ Fetch tree submission from DB
  useEffect(() => {
    const fetchSubmission = async () => {
      const { data, error } = await supabase
        .from("tree_submissions")
        .select("submission_id, latitude, longitude, tree_type")
        .eq("submission_id", id)
        .maybeSingle();

      if (error) {
        console.error("⚠️ Failed to load tree:", error.message);
        setToastMsg("⚠️ Failed to load tree");
        return;
      }
      setSubmission(data);
    };
    fetchSubmission();
  }, [id]);

  // ✅ Fetch Supabase user & initialize Radar
  useEffect(() => {
    const initRadar = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("⚠️ Supabase error:", error.message);
        return;
      }
      if (!user) {
        history.push("/login");
        return;
      }

      setUser(user);

      try {
        // Initialize Radar with publishable key
        Radar.initialize("prj_test_pk_f8f29ac369c143d142cd2a5db92d7c59dde34027");

        // Attach user info
        Radar.setUserId(user.id);
        Radar.setMetadata({ email: user.email ?? "unknown" });

        console.log("✅ Radar initialized for:", user.email);
      } catch (err) {
        console.error("⚠️ Radar init failed:", err);
      }
    };

    initRadar();
  }, [history]);

  // ✅ Smooth update helper
  const smoothUpdate = (
    prev: number | null,
    next: number,
    alpha: number = 0.2
  ) => {
    if (prev === null) return next;
    return prev + alpha * (next - prev);
  };

  // ✅ Track user position & compute distance/bearing
  useEffect(() => {
    if (!submission) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setUserLat((prev) => smoothUpdate(prev, lat));
        setUserLng((prev) => smoothUpdate(prev, lng));

        const dist = getDistanceMeters(
          lat,
          lng,
          submission.latitude,
          submission.longitude
        );
        const brg = getBearing(
          lat,
          lng,
          submission.latitude,
          submission.longitude
        );
        setDistance(dist);
        setBearing(brg);

        // ✅ Push live updates to Radar
        Radar.trackOnce({ latitude: lat, longitude: lng })
          .then((res) => {
            console.log("📡 Radar update:", res);
          })
          .catch((err) => {
            console.warn("⚠️ Radar tracking error:", err);
          });
      },
      (err) => {
        setToastMsg("⚠️ Location error");
        console.error("❌ Geolocation error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 500, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [submission]);

  // ✅ Device orientation for compass heading
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHeading(e.alpha);
      }
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  // ✅ Beeping logic (plays when within 7m of tree)
  useEffect(() => {
    if (distance > 0 && distance <= 7) {
      if (!beepInterval.current) {
        setToastMsg("🎵 You're close to the tree!");
        beepInterval.current = setInterval(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current
              .play()
              .catch((err) => console.warn("Audio blocked:", err));
          }
        }, 1000);
      }
    } else {
      if (beepInterval.current) {
        clearInterval(beepInterval.current);
        beepInterval.current = null;
      }
    }

    return () => {
      if (beepInterval.current) {
        clearInterval(beepInterval.current);
        beepInterval.current = null;
      }
    };
  }, [distance]);

  // ✅ Radar-style drawing loop
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

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(0,255,0,0.3)";
      ctx.lineWidth = 1;
      for (let r = radius / 4; r <= radius; r += radius / 4) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const sweepX = centerX + radius * Math.cos(sweepAngle.current);
      const sweepY = centerY + radius * Math.sin(sweepAngle.current);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      const relativeBearing = ((bearing - heading) * Math.PI) / 180;
      ctx.rotate(relativeBearing);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.restore();

      const brgRad = ((bearing - heading) * Math.PI) / 180;
      const maxRange = 200;
      const distNorm = Math.min(distance / maxRange, 1) * radius;
      const dotX = centerX + distNorm * Math.cos(brgRad);
      const dotY = centerY + distNorm * Math.sin(brgRad);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "lime";
      ctx.fill();

      sweepAngle.current += 0.05;
      if (sweepAngle.current > Math.PI * 2) sweepAngle.current = 0;

      requestAnimationFrame(draw);
    };

    draw();
  }, [bearing, distance, heading, submission, userLat, userLng]);

  // ✅ Distance helper
  const getDistanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ✅ Bearing helper
  const getBearing = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const toDeg = (v: number) => (v * 180) / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(lat1 * Math.PI / 180) *
        Math.cos(toRad(lat2)) *
        Math.cos(dLon);
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
        <audio ref={audioRef} src="/Yamete Kudasai.mp3" preload="auto" />

        {!submission || !userLat || !userLng ? (
          <IonSpinner name="crescent" />
        ) : (
          <>
            <h2>{submission.tree_type}</h2>
            <p>Distance: {distance.toFixed(1)} m</p>
            <p>Bearing: {bearing.toFixed(1)}°</p>
            <p>Heading: {heading.toFixed(1)}°</p>

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
          duration={2500}
          onDidDismiss={() => setToastMsg("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default RadarPage;
