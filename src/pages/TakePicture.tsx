// src/pages/TakePicture.tsx
import React, { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

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

  const getUserCoordinates = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err: any) {
      console.error("Geolocation error:", err.message);
      setToastMsg("⚠️ Unable to get your location. Enable location services.");
      setShowToast(true);
      return { latitude: 0, longitude: 0 };
    }
  };

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

  const submitMonitoring = async () => {
    if (!imageUrl) {
      setToastMsg("⚠️ Please take a photo first");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      // --- Local timezone "today" start and end ---
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Check if user already submitted today
      const { data: existingToday } = await supabase
        .from("tree_monitoring")
        .select("id")
        .eq("submission_id", submission_id)
        .eq("user_id", user.id)
        .gte("monitored_at", startOfDay.toISOString())
        .lte("monitored_at", endOfDay.toISOString())
        .limit(1);

      if (existingToday && existingToday.length > 0) {
        setToastMsg("⚠️ You can only submit once per day for this tree.");
        setShowToast(true);
        setLoading(false);
        return;
      }

      // Get tree coordinates
      const { data: treeData, error: treeError } = await supabase
        .from("tree_submissions")
        .select("latitude, longitude")
        .eq("id", submission_id)
        .single();

      if (treeError || !treeData) throw new Error("Unable to fetch tree coordinates.");

      const { latitude: treeLat, longitude: treeLon } = treeData;

      // Get user location
      const { latitude, longitude } = await getUserCoordinates();
      if (latitude === 0 && longitude === 0) {
        setLoading(false);
        return;
      }

      // Validate distance
      const distance = getDistanceMeters(latitude, longitude, treeLat, treeLon);
      if (distance > 5) {
        setToastMsg("⚠️ You are too far from the tree. Move closer to submit (within 5 meters).");
        setShowToast(true);
        setLoading(false);
        return;
      }

      // Insert monitoring
      const { error: insertError } = await supabase.from("tree_monitoring").insert([
        {
          submission_id,
          user_id: user.id,
          latitude,
          longitude,
          image_url: imageUrl,
          monitored_at: new Date().toISOString(),
          condition,
          notes: "",
        },
      ]);

      if (insertError) throw insertError;

      setToastMsg("✅ Monitoring submitted successfully!");
      setShowToast(true);
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
        <IonButton expand="block" onClick={takePhoto}>
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

        <IonButton expand="block" color="success" onClick={submitMonitoring} disabled={loading}>
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
