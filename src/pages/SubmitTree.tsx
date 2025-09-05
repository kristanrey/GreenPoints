import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonImg,
  IonToast,
  IonLoading,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { checkmarkDoneCircle } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

const SubmitNewTree: React.FC = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  const [treeType, setTreeType] = useState("");
  const [datePlanted, setDatePlanted] = useState("");
  const [locationDescription, setLocationDescription] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ✅ Webcam start with AbortError fix
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Video play failed:", err);
          }
        }
      }
    } catch (err) {
      console.error("Webcam error:", err);
    }
  };

  // ✅ Stop webcam and cleanup
  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    streamRef.current = null;
  };

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, []);

  // 📸 Capture photo from webcam
  const handleTakePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL("image/jpeg"));
    }
  };

  // 📤 Submit tree to Supabase
  const handleSubmit = async () => {
    if (!photo || !treeType || !datePlanted || !locationDescription) {
      setShowToast({ show: true, message: "Please complete all fields and take a photo." });
      return;
    }

    setSubmitting(true);
    try {
      const position = await Geolocation.getCurrentPosition();

      const { error } = await supabase.from("tree_submissions").insert([
        {
          tree_type: treeType,
          date_planted: datePlanted,
          location_description: locationDescription,
          photo,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          status: "pending",
        },
      ]);

      if (error) throw error;

      setShowToast({ show: true, message: "Tree submitted successfully!" });
      setPhoto(null);
      setTreeType("");
      setDatePlanted("");
      setLocationDescription("");
    } catch (err: any) {
      console.error(err);
      setShowToast({ show: true, message: "Error submitting tree." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Submit New Tree</h2>
        </IonText>

        {/* Webcam Preview */}
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }} />

        {/* Photo Preview */}
        {photo && (
          <IonImg
            src={photo}
            style={{ marginTop: "10px", border: "2px solid #4caf50" }}
          />
        )}

        {/* Form Fields */}
        <IonItem>
          <IonLabel position="floating">Tree Type</IonLabel>
          <IonInput
            value={treeType}
            onIonChange={(e) => setTreeType(e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Date Planted</IonLabel>
          <IonInput
            type="date"
            value={datePlanted}
            onIonChange={(e) => setDatePlanted(e.detail.value as string)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Location Description</IonLabel>
          <IonInput
            value={locationDescription}
            onIonChange={(e) => setLocationDescription(e.detail.value!)}
          />
        </IonItem>

        {/* Capture Button */}
        <IonButton
          expand="full"
          color="success"
          onClick={handleTakePhoto}
          disabled={submitting}
        >
          {submitting ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <IonIcon icon={checkmarkDoneCircle} slot="start" />
              Take Photo
            </>
          )}
        </IonButton>

        {/* Submit Button */}
        <IonButton
          expand="full"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <IonIcon icon={checkmarkDoneCircle} slot="start" />
              Submit Tree
            </>
          )}
        </IonButton>

        {/* Toast Notifications */}
        <IonToast
          isOpen={showToast.show}
          message={showToast.message}
          duration={2000}
          onDidDismiss={() => setShowToast({ show: false, message: "" })}
        />

        {/* Loading Overlay */}
        <IonLoading isOpen={submitting} message="Submitting..." />
      </IonContent>
    </IonPage>
  );
};

export default SubmitNewTree;
