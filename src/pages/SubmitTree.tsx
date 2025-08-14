// src/pages/SubmitNewTree.tsx
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
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../utils/supabaseClient";
import { camera as cameraIcon, checkmarkCircle } from "ionicons/icons";

const BUCKET = "tree-images"; // your Supabase storage bucket name

const SubmitNewTree: React.FC = () => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [isNative, setIsNative] = useState<boolean>(false);
  const [usingWebcam, setUsingWebcam] = useState<boolean>(false);

  // Webcam refs (desktop)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    // On desktop/web, start webcam automatically
    if (!isNative) {
      startWebcam();
      setUsingWebcam(true);
    }
    return () => stopWebcam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative]);

  const startWebcam = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Webcam error:", err);
      show("Unable to access webcam. You can upload from file instead.");
      setUsingWebcam(false);
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    setPhotoDataUrl(dataUrl);
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
    } catch (err) {
      console.error(err);
      show("Camera canceled or unavailable.");
    }
  };

  const getGeo = async () => {
    try {
      if (isNative) {
        const pos = await Geolocation.getCurrentPosition();
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } else {
        await new Promise<void>((resolve, reject) => {
          if (!("geolocation" in navigator)) {
            reject("Geolocation not supported.");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
              resolve();
            },
            (err) => reject(err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
          );
        });
      }
    } catch (err: any) {
      console.error("Geolocation error:", err);
      show("Unable to get location. Please allow location permission.");
    }
  };

  const dataUrlToBlob = (dataUrl: string) => {
    const [meta, b64] = dataUrl.split(",");
    const mimeMatch = meta.match(/data:(.*);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binStr = atob(b64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleSubmit = async () => {
    try {
      if (!photoDataUrl) {
        show("Please take a photo first.");
        return;
      }
      setBusy(true);

      // 1) Ensure logged in
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error("You must be logged in.");

      // 2) Ensure we have GPS
      if (!coords) {
        await getGeo();
        if (!coords) throw new Error("Location required.");
      }

      // 3) Upload to storage
      const blob = dataUrlToBlob(photoDataUrl);
      const filename = `trees/${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase
        .storage
        .from(BUCKET)
        .upload(filename, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      const publicUrl = pub?.publicUrl ?? null;

      // 4) Insert DB row
      const { error: dbErr } = await supabase.from("tree_submissions").insert([
        {
          user_id: user.id,
          image_path: filename,
          image_url: publicUrl,
          latitude: coords.lat,
          longitude: coords.lng,
          status: "pending",
          description: "Planted a new tree 🌱",
        },
      ]);
      if (dbErr) throw dbErr;

      show("✅ Tree submitted with geo-tag! Awaiting validation.");
      // reset UI
      setPhotoDataUrl(null);
      setCoords(null);
    } catch (err: any) {
      console.error(err);
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
          <p>Take a photo and we’ll attach your GPS location.</p>
        </IonText>

        {/* Mobile / Native: Use Capacitor Camera */}
        {isNative && !photoDataUrl && (
          <IonButton expand="block" onClick={takePhotoMobile}>
            <IonIcon icon={cameraIcon} slot="start" />
            Open Camera
          </IonButton>
        )}

        {/* Desktop/Web: Webcam live preview */}
        {!isNative && !photoDataUrl && (
          <div>
            {usingWebcam ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: "100%", borderRadius: 12 }}
                />
                <IonButton expand="block" onClick={captureFromWebcam} className="ion-margin-top">
                  <IonIcon icon={cameraIcon} slot="start" />
                  Take Photo
                </IonButton>
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </>
            ) : (
              <IonText>
                <p>Webcam unavailable. Try mobile camera or allow webcam access.</p>
              </IonText>
            )}
          </div>
        )}

        {/* Preview + location button */}
        {photoDataUrl && (
          <>
            <IonImg src={photoDataUrl} style={{ borderRadius: 12, marginTop: 12 }} />
            <IonButton expand="block" color="medium" onClick={() => setPhotoDataUrl(null)} className="ion-margin-top">
              Retake Photo
            </IonButton>
          </>
        )}

        <IonButton expand="block" onClick={getGeo} className="ion-margin-top">
          Get Current Location
        </IonButton>

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
          <IonIcon icon={checkmarkCircle} slot="start" />
          Submit Tree
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
