// src/pages/SubmitNewTree.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonToast,
  IonSpinner,
  IonImg,
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import exifr from "exifr";
  import { supabase } from "../utils/supabaseClient";

const SubmitNewTree: React.FC = () => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [treeType, setTreeType] = useState("");
  const [description, setDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [datePlanted, setDatePlanted] = useState("");
  const [exifData, setExifData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // Convert DataURL to Blob
  const dataUrlToBlob = (dataUrl: string) => {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
    const binStr = atob(b64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  // Get device location
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
      return newCoords;
    } catch (err) {
      showToast("Unable to get location. Please allow location permission.");
      return null;
    }
  };

  // Extract EXIF data
  const extractExif = async (blob: Blob) => {
    try {
      const metadata = await exifr.parse(blob, { gps: true });
      if (metadata) {
        setExifData(metadata);
        if (metadata.latitude && metadata.longitude) {
          setCoords({ lat: metadata.latitude, lng: metadata.longitude });
        }
      }
    } catch (err) {
      console.warn("No EXIF metadata found:", err);
    }
  };

  // Take photo on mobile
  const takePhotoMobile = async () => {
    try {
      const image = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 85,
        correctOrientation: true,
      });
      setPhotoDataUrl(image.dataUrl ?? null);

      if (image.dataUrl) {
        const blob = dataUrlToBlob(image.dataUrl);
        await extractExif(blob);
      }

      await getGeoCoords();
    } catch {
      showToast("Camera canceled or unavailable.");
    }
  };

  const handleSubmit = async () => {
    if (!photoDataUrl) return showToast("Please take a photo first.");
    if (!treeType || !datePlanted || !locationDescription)
      return showToast("Please fill all fields.");

    setLoading(true);
    try {
      const currentCoords = coords || (await getGeoCoords());
      if (!currentCoords) throw new Error("Location required.");

      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error("You must be logged in.");

      const blob = dataUrlToBlob(photoDataUrl);
      const fileName = `submissions/${user.id}_${Date.now()}.jpg`;

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = pub?.publicUrl ?? "";

      // Insert into tree_submissions
      const { error: insertError } = await supabase.from("tree_submissions").insert([
        {
          user_id: user.id,
          image_path: fileName,
          image_url: publicUrl,
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          status: "pending",
          description,
          date_planted: datePlanted,
          tree_type: treeType,
          location_description: locationDescription,
          greenpoints: 0,
          exif_metadata: exifData ? JSON.stringify(exifData) : null,
        },
      ]);
      if (insertError) throw insertError;

      showToast("✅ Tree submitted successfully! Awaiting validation.");
      setPhotoDataUrl(null);
      setCoords(null);
      setTreeType("");
      setDescription("");
      setLocationDescription("");
      setDatePlanted("");
      setExifData(null);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ ${err.message || "Submission failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => setToastMsg(msg);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Submit New Tree</h2>

        <IonItem>
          <IonLabel position="floating">Tree Type</IonLabel>
          <IonInput value={treeType} onIonChange={(e) => setTreeType(e.detail.value!)} />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Date Planted</IonLabel>
          <IonInput type="date" value={datePlanted} onIonChange={(e) => setDatePlanted(e.detail.value!)} />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Location Description</IonLabel>
          <IonInput value={locationDescription} onIonChange={(e) => setLocationDescription(e.detail.value!)} />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Description</IonLabel>
          <IonTextarea value={description} onIonChange={(e) => setDescription(e.detail.value!)} />
        </IonItem>

        {!photoDataUrl && (
          <IonButton expand="block" onClick={takePhotoMobile}>
            Take Photo
          </IonButton>
        )}

        {photoDataUrl && (
          <>
            <IonImg src={photoDataUrl} style={{ borderRadius: 12, marginTop: 12 }} />
            <IonButton expand="block" color="medium" onClick={() => setPhotoDataUrl(null)}>
              Retake Photo
            </IonButton>
          </>
        )}

        {coords && (
          <p>
            📍 Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
          </p>
        )}

        <IonButton expand="block" color="success" onClick={handleSubmit} disabled={loading || !photoDataUrl}>
          {loading ? <IonSpinner name="crescent" /> : "Submit Tree"}
        </IonButton>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={3000} onDidDismiss={() => setToastMsg("")} />
      </IonContent>
    </IonPage>
  );
};

export default SubmitNewTree;
