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

interface Params {
  submission_id: string;
}

const TakePicture: React.FC = () => {
  const { submission_id } = useParams<Params>();
  const history = useHistory();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [condition, setCondition] = useState<string>("Growing"); // default to Growing
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

  const submitMonitoring = async () => {
    if (!imageUrl) {
      setToastMsg("⚠️ Please take a photo first");
      setShowToast(true);
      return;
    }

    if (!condition) {
      setToastMsg("⚠️ Please select the tree condition");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      // Fetch existing monitoring count for this submission
      const { data: monitorCountData, error: countError } = await supabase
        .from("tree_monitoring")
        .select("monitor_id", { count: "exact" })
        .eq("submission_id", submission_id);

      if (countError) throw countError;

      const currentVisits = monitorCountData?.length || 0;
      if (currentVisits >= 5) {
        setToastMsg("⚠️ Maximum 5 monitoring entries reached for this tree");
        setShowToast(true);
        setLoading(false);
        return;
      }

      // Insert new monitoring record
      const { error: monitorError } = await supabase.from("tree_monitoring").insert([
        {
          submission_id,
          user_id: user.id,
          latitude: 0, // optional: fetch real lat/lng if available
          longitude: 0,
          image_url: imageUrl,
          monitored_at: new Date().toISOString(),
          condition, // must match DB constraint: 'Growing', 'Dying', 'Removed'
          notes: "",
          visits: currentVisits + 1, // track visits per submission
        },
      ]);

      if (monitorError) throw monitorError;

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
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
        }}
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
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default TakePicture;
