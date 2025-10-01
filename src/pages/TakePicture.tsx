// src/pages/TakePicture.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonToast,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
} from "@ionic/react";
import { useHistory, useParams } from "react-router";
import { supabase } from "../utils/supabaseClient";
import { Camera, CameraResultType } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";

interface Params {
  submission_id: string;
}

const TakePicture: React.FC = () => {
  const { submission_id } = useParams<Params>();
  const history = useHistory();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [condition, setCondition] = useState<string>("Growing");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // 📸 Take a photo
  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        quality: 90,
      });
      if (photo.dataUrl) setImageUrl(photo.dataUrl);
    } catch (err: any) {
      setToastMsg("Error taking photo: " + err.message);
      setShowToast(true);
    }
  };

  // 📍 Get user coordinates
  const getUserCoordinates = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err: any) {
      setToastMsg("⚠️ Unable to get your location. Enable location services.");
      setShowToast(true);
      return { latitude: 0, longitude: 0 };
    }
  };

  // 📏 Distance calculator
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ⏳ Check if user already submitted in the last 24h
  const calculateTimeRemaining = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: lastSubmission } = await supabase
        .from("tree_monitoring")
        .select("monitored_at")
        .eq("user_id", user.id)
        .order("monitored_at", { ascending: false })
        .limit(1)
        .single();

      if (lastSubmission) {
        const lastTime = new Date(lastSubmission.monitored_at).getTime();
        const now = new Date().getTime();
        const diffMs = 24 * 60 * 60 * 1000 - (now - lastTime);

        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining("");
        }
      } else {
        setTimeRemaining("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 Submit monitoring
  const submitMonitoring = async () => {
    if (!imageUrl) {
      setToastMsg("⚠️ Please take a photo first");
      setShowToast(true);
      return;
    }

    if (timeRemaining) {
      setToastMsg(`⚠️ You can only submit once per day. Try again in ${timeRemaining}`);
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const { data: treeData, error: treeError } = await supabase
        .from("tree_submissions")
        .select("latitude, longitude, tree_name")
        .eq("submission_id", Number(submission_id))
        .single();

      if (treeError || !treeData) throw new Error("Tree not found");

      const { latitude: treeLat, longitude: treeLon } = treeData;

      const { latitude, longitude } = await getUserCoordinates();
      if (latitude === 0 && longitude === 0) {
        setLoading(false);
        return;
      }

      const distance = getDistanceMeters(latitude, longitude, treeLat, treeLon);
      if (distance > 5) {
        setToastMsg("⚠️ You are too far from the tree (must be within 5 meters).");
        setShowToast(true);
        setLoading(false);
        return;
      }

      // 🎯 Always 2 points no matter the condition
      const monitorPoints = 2;

      // Insert monitoring record
      const { error: insertError } = await supabase.from("tree_monitoring").insert([
        {
          submission_id: Number(submission_id),
          user_id: user.id,
          latitude,
          longitude,
          image_url: imageUrl,
          monitored_at: new Date().toISOString(),
          condition,
          notes,
          monitor_points: monitorPoints,
        },
      ]);

      if (insertError) throw insertError;

      // ✅ Update user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("greenpoints")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            greenpoints: (profile.greenpoints || 0) + monitorPoints,
          })
          .eq("id", user.id);
      }

      setToastMsg(
        `✅ Monitoring submitted for tree: ${treeData.tree_name}. You earned +${monitorPoints} GreenPoints!`
      );
      setShowToast(true);
      setImageUrl("");
      setNotes("");
      setTimeRemaining("24h 0m");
      setTimeout(() => history.push("/my-submissions"), 2000);
    } catch (err: any) {
      setToastMsg("Error: " + err.message);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Take Picture</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}
      >
        <IonButton expand="block" onClick={takePhoto} disabled={!!timeRemaining}>
          📸 Take Photo
        </IonButton>

        {imageUrl && (
          <img src={imageUrl} alt="Captured" style={{ maxWidth: "100%", borderRadius: "8px" }} />
        )}

        <IonSelect
          value={condition}
          placeholder="Select Tree Condition"
          onIonChange={(e) => setCondition(e.detail.value!)}
          interface="popover"
          style={{ width: "200px" }}
        >
          <IonSelectOption value="Growing">Growing</IonSelectOption>
          <IonSelectOption value="Dying">Dying</IonSelectOption>
          <IonSelectOption value="Removed">Removed</IonSelectOption>
        </IonSelect>

        <IonTextarea
          value={notes}
          placeholder="Write notes about the tree..."
          autoGrow={true}
          onIonChange={(e) => setNotes(e.detail.value!)}
          style={{ width: "100%" }}
        />

        {timeRemaining && (
          <IonText color="danger">⏳ Next submission available in {timeRemaining}</IonText>
        )}

        <IonButton
          expand="block"
          color="success"
          onClick={submitMonitoring}
          disabled={loading || !!timeRemaining}
        >
          {loading ? <IonSpinner /> : "✅ Submit Monitoring"}
        </IonButton>

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

export default TakePicture;
