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
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../utils/supabaseClient";
import { camera as cameraIcon, checkmarkCircle } from "ionicons/icons";
  import "./SubmitNewTree.css";

const BUCKET = "tree_submissions";

const SubmitNewTree: React.FC = () => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [isNative, setIsNative] = useState<boolean>(false);
  const [usingWebcam, setUsingWebcam] = useState<boolean>(false);

  // new states for inputs
  const [datePlanted, setDatePlanted] = useState<string>("");
  const [treeName, setTreeName] = useState<string>("");
  const [locationDesc, setLocationDesc] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
  if (!Capacitor.isNativePlatform()) {
    startWebcam();
    setUsingWebcam(true);
  }

  // Cleanup only on unmount
  return () => {
    stopWebcam();
  };
}, []); // empty dependency → run only once

const startWebcam = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      try {
        await videoRef.current.play();
      } catch (err: any) {
        // ✅ Fix: ignore AbortError, only log other errors
        if (err.name !== "AbortError") {
          console.error("Video play failed:", err);
        }
      }
    }
  } catch (err) {
    console.error("Webcam error:", err);
    show("Unable to access webcam. Try mobile.");
    setUsingWebcam(false);
  }
};
  

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Get current location
  const getGeoCoords = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      let position;
      if (isNative) {
        position = await Geolocation.getCurrentPosition();
      } else {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!("geolocation" in navigator)) reject("Geolocation not supported");
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          });
        });
      }

      const newCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoords(newCoords);
      console.log("✅ GPS coords obtained:", newCoords);
      return newCoords;
    } catch (err) {
      console.error("⚠️ Error getting location:", err);
      show("Unable to get location. Please allow location permission.");
      return null;
    }
  };

  const captureFromWebcam = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    setPhotoDataUrl(c.toDataURL("image/jpeg", 0.9));
    await getGeoCoords();
  };

  const takePhotoMobile = async () => {
    try {
      const image = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 85,
        correctOrientation: true,
      });
      setPhotoDataUrl(image.dataUrl ?? null);
      await getGeoCoords();
    } catch (err) {
      console.error("Camera error:", err);
      show("Camera canceled or unavailable.");
    }
  };

  const dataUrlToBlob = (dataUrl: string) => {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
    const binStr = atob(b64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleSubmit = async () => {
    try {
      if (!photoDataUrl) return show("Please take a photo first.");
      if (!datePlanted || !treeName || !locationDesc)
        return show("Please fill all fields.");

      // Ensure we have coords
      let currentCoords = coords;
      if (!currentCoords) {
        currentCoords = await getGeoCoords();
        if (!currentCoords) return show("Location required.");
      }

      setBusy(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error("You must be logged in");

      console.log("Submitting with coords:", currentCoords);

      const blob = dataUrlToBlob(photoDataUrl);
      const filename = `trees/${user.id}/${Date.now()}.jpg`;

      // Upload image to storage
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filename, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      // Get public URL
      const { data: pub } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filename);
      const publicUrl = pub?.publicUrl ?? null;

      // Insert record with geo + extra fields
      const { error: dbErr } = await supabase.from("tree_submissions").insert([
        {
          user_id: user.id,
          image_path: filename,
          image_url: publicUrl,
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          status: "pending",
          description: "Planted a new tree 🌱",
          date_planted: datePlanted,
          tree_type: treeName,
          location_description: locationDesc,
        },
      ]);
      if (dbErr) throw dbErr;

      show("✅ Tree submitted successfully! Awaiting validation.");
      setPhotoDataUrl(null);
      setCoords(null);
      setDatePlanted("");
      setTreeName("");
      setLocationDesc("");
    } catch (err: any) {
      console.error("Submit error:", err);
      show(`❌ ${err.message || "Submission failed"}`);
    } finally {
      setBusy(false);
    }
  };

  const show = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Submit New Tree</h2>
          <p>Fill out the details and take a photo of your tree.</p>
        </IonText>

        {/* Input fields */}
        <IonItem>
          <IonLabel position="floating">Date Planted</IonLabel>
          <IonInput
            type="date"
            value={datePlanted}
            onIonChange={(e) => setDatePlanted(e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Name of Tree</IonLabel>
          <IonInput
            value={treeName}
            onIonChange={(e) => setTreeName(e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Planted Where</IonLabel>
          <IonInput
            value={locationDesc}
            onIonChange={(e) => setLocationDesc(e.detail.value!)}
          />
        </IonItem>

        {isNative && !photoDataUrl && (
          <IonButton expand="block" onClick={takePhotoMobile}>
            <IonIcon icon={cameraIcon} slot="start" /> Open Camera
          </IonButton>
        )}

        {!isNative && !photoDataUrl && usingWebcam && (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", borderRadius: 12 }}
            />
            <IonButton
              expand="block"
              onClick={captureFromWebcam}
              className="ion-margin-top"
            >
              <IonIcon icon={cameraIcon} slot="start" /> Take Photo
            </IonButton>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {photoDataUrl && (
          <>
            <IonImg
              src={photoDataUrl}
              style={{ borderRadius: 12, marginTop: 12 }}
            />
            <IonButton
              expand="block"
              color="medium"
              onClick={() => setPhotoDataUrl(null)}
              className="ion-margin-top"
            >
              Retake Photo
            </IonButton>
          </>
        )}

        {coords && (
          <IonText>
            <p className="ion-margin-top">
              📍 <strong>Lat:</strong> {coords.lat.toFixed(6)} &nbsp;&nbsp;
              <strong>Lng:</strong> {coords.lng.toFixed(6)}
            </p>
          </IonText>
        )}

        <IonButton
          expand="block"
          color="success"
          onClick={handleSubmit}
          disabled={!photoDataUrl}
          className="ion-margin-top"
        >
          <IonIcon icon={checkmarkCircle} slot="start" /> Submit Tree
        </IonButton>

        <IonLoading isOpen={busy} message="Submitting..." />
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

export default SubmitNewTree;
