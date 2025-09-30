// src/pages/SubmitNewTree.tsx
import React, { useEffect, useState } from "react";
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import { Camera, CameraSource, CameraDirection, CameraResultType } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../utils/supabaseClient";
import { camera, cameraReverse, images, checkmarkCircle } from "ionicons/icons";
import exifr from "exifr";
import * as piexif from "piexifjs"; // ✅ fixed import
import "./SubmitNewTree.css";

const SubmitNewTree: React.FC = () => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [isNative, setIsNative] = useState<boolean>(false);
  const [useFrontCamera, setUseFrontCamera] = useState<boolean>(false);
  const [datePlanted, setDatePlanted] = useState<string>("");
  const [treeName, setTreeName] = useState<string>("");
  const [locationDesc, setLocationDesc] = useState<string>("");
  const [exifData, setExifData] = useState<any>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const show = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  // ✅ Fallback geolocation
  const getGeoCoords = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      let position;
      if (isNative) {
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      } else {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!("geolocation" in navigator)) reject("Geolocation not supported");
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        });
      }
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch {
      show("Unable to get location. Please allow location permission.");
      return null;
    }
  };

  const degToDmsRational = (deg: number) => {
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    const s = Math.round(((deg - d) * 60 - m) * 60 * 100);
    return [
      [d, 1],
      [m, 1],
      [s, 100],
    ];
  };

  // ✅ TypeScript-safe GPS injection
  const injectGpsExif = (dataUrl: string, lat: number, lng: number) => {
    const exifObj: any = piexif.load(dataUrl); // cast to any for TS
    if (!exifObj["GPS"]) exifObj["GPS"] = {}; // ensure GPS exists

    exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? "N" : "S";
    exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = degToDmsRational(Math.abs(lat));
    exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? "E" : "W";
    exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = degToDmsRational(Math.abs(lng));

    const exifBytes = piexif.dump(exifObj);
    return piexif.insert(exifBytes, dataUrl);
  };

  const extractExif = async (blob: Blob) => {
    try {
      const metadata = await exifr.parse(blob, { gps: true });
      if (metadata) setExifData(metadata);
    } catch (err) {
      console.warn("No EXIF metadata found:", err);
    }
  };

  const takeOrPickPhoto = async (source: CameraSource) => {
    try {
      const image = await Camera.getPhoto({
        source,
        resultType: CameraResultType.DataUrl,
        quality: 85,
        correctOrientation: true,
        direction: useFrontCamera ? CameraDirection.Front : CameraDirection.Rear,
      });

      if (!image.dataUrl) return show("Failed to capture photo.");
      let photoUrl = image.dataUrl;

      const highAccCoords = await getGeoCoords();
      if (!highAccCoords) return show("Unable to get GPS coordinates.");

      // Inject high-accuracy GPS into EXIF
      photoUrl = injectGpsExif(photoUrl, highAccCoords.lat, highAccCoords.lng);

      setPhotoDataUrl(photoUrl);
      setCoords(highAccCoords);

      const exifBlob = await (await fetch(photoUrl)).blob();
      await extractExif(exifBlob);
    } catch (err) {
      console.error(err);
      show("Camera canceled or unavailable.");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!photoDataUrl) return show("Please take a photo first.");
      if (!datePlanted || !treeName || !locationDesc) return show("Please fill all fields.");

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

      const blob = await (await fetch(photoDataUrl!)).blob();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();
      const username = profileData?.username || user.id;

      const filename = `${username}/tree_submissions/${Date.now()}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("greenpoints")
        .upload(filename, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("greenpoints").getPublicUrl(filename);
      const publicUrl = pub?.publicUrl ?? null;

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
          exif_metadata: exifData ? JSON.stringify(exifData) : null,
        },
      ]);
      if (dbErr) throw dbErr;

      const { count } = await supabase
        .from("tree_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      await supabase.from("users").update({ treesPlanted: count }).eq("id", user.id);

      show("✅ Tree submitted successfully! Awaiting validation.");
      setPhotoDataUrl(null);
      setCoords(null);
      setDatePlanted("");
      setTreeName("");
      setLocationDesc("");
      setExifData(null);
    } catch (err: any) {
      show(`❌ ${err.message || "Submission failed"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Submit New Tree</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
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
              <IonInput value={treeName} onIonChange={(e) => setTreeName(e.detail.value!)} />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Planted Where</IonLabel>
              <IonInput
                value={locationDesc}
                onIonChange={(e) => setLocationDesc(e.detail.value!)}
              />
            </IonItem>

            {!photoDataUrl && (
              <div className="ion-margin-top">
                <IonButton expand="block" onClick={() => takeOrPickPhoto(CameraSource.Camera)}>
                  <IonIcon icon={camera} slot="start" /> Take Photo
                </IonButton>
                <IonButton
                  expand="block"
                  onClick={() => takeOrPickPhoto(CameraSource.Photos)}
                  className="ion-margin-top"
                >
                  <IonIcon icon={images} slot="start" /> Choose from Gallery
                </IonButton>
                <IonButton
                  expand="block"
                  color="medium"
                  onClick={() => setUseFrontCamera(!useFrontCamera)}
                  className="ion-margin-top"
                >
                  <IonIcon icon={cameraReverse} slot="start" /> Switch Camera
                </IonButton>
              </div>
            )}

            {photoDataUrl && (
              <>
                <IonImg src={photoDataUrl} style={{ borderRadius: 12, marginTop: 12 }} />
                <IonButton
                  expand="block"
                  color="medium"
                  onClick={() => setPhotoDataUrl(null)}
                  className="ion-margin-top"
                >
                  Retake / Select Another
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

            {exifData && (
              <IonText>
                <p className="ion-margin-top">
                  📷 <strong>Camera:</strong> {exifData.Make || "Unknown"} {exifData.Model || ""} <br />
                  🕒 <strong>Taken:</strong>{" "}
                  {exifData.DateTimeOriginal
                    ? new Date(exifData.DateTimeOriginal).toLocaleString()
                    : "Not available"}
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
          </IonCardContent>
        </IonCard>

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
