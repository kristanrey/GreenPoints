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
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
} from "@ionic/react";
import { Camera, CameraSource, CameraDirection, CameraResultType } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../utils/supabaseClient";
import { camera, cameraReverse, images, checkmarkCircle } from "ionicons/icons";
import exifr from "exifr";
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
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [exifData, setExifData] = useState<any>(null);

  const [treeOptions, setTreeOptions] = useState<{ tree_id: number; tree_name: string }[]>([]);
  const [locationOptions, setLocationOptions] = useState<
    { location_id: number; municipality: string; barangay: string }[]
  >([]);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    fetchTrees();
    fetchLocations();
  }, []);

  // Fetch trees from DB
  const fetchTrees = async () => {
    const { data, error } = await supabase.from("trees").select("tree_id, tree_name").order("tree_name");
    if (error) console.error("Failed to fetch trees:", error);
    else setTreeOptions(data || []);
  };

  // Fetch locations from DB
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("location_id, municipality, barangay")
      .order("municipality")
      .order("barangay");
    if (error) console.error("Failed to fetch locations:", error);
    else setLocationOptions(data || []);
  };

  // fallback geolocation (only if EXIF missing)
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
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch {
      show("Unable to get location. Please allow location permission.");
      return null;
    }
  };

  // always prefer EXIF GPS
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

  const takeOrPickPhoto = async (source: CameraSource) => {
    try {
      const image = await Camera.getPhoto({
        source,
        resultType: CameraResultType.Uri,
        quality: 85,
        correctOrientation: true,
        direction: useFrontCamera ? CameraDirection.Front : CameraDirection.Rear,
      });

      const path = image.path || image.webPath;
      if (!path) return show("Failed to capture photo.");

      const photoUrl = Capacitor.convertFileSrc(path);
      setPhotoDataUrl(photoUrl);

      const blob = await fetch(path).then((r) => r.blob());
      await extractExif(blob);

      if (!coords) {
        const fallbackCoords = await getGeoCoords();
        if (fallbackCoords) setCoords(fallbackCoords);
      }
    } catch (err) {
      console.error(err);
      show("Camera canceled or unavailable.");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!photoDataUrl) return show("Please take a photo first.");
      if (!datePlanted || !selectedTree || !selectedMunicipality || !selectedBarangay)
        return show("Please fill all fields.");

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

      const blob = await fetch(photoDataUrl).then((r) => r.blob());

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

      // Save EXIF + coords + dropdown selections to DB
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
          tree_name: selectedTree, // <-- INSERT into tree_name, removed tree_type
          municipality: selectedMunicipality,
          barangay: selectedBarangay,
          exif_metadata: exifData ? JSON.stringify(exifData) : null,
        },
      ]);
      if (dbErr) throw dbErr;

      show("✅ Tree submitted successfully! Awaiting validation.");
      setPhotoDataUrl(null);
      setCoords(null);
      setDatePlanted("");
      setSelectedTree(null);
      setSelectedMunicipality(null);
      setSelectedBarangay(null);
      setExifData(null);
    } catch (err: any) {
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
              <IonSelect
                value={selectedTree}
                placeholder="Select a tree"
                onIonChange={(e) => setSelectedTree(e.detail.value)}
              >
                {treeOptions.map((t) => (
                  <IonSelectOption key={t.tree_id} value={t.tree_name}>
                    {t.tree_name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Municipality</IonLabel>
              <IonSelect
                value={selectedMunicipality}
                placeholder="Select municipality"
                onIonChange={(e) => {
                  setSelectedMunicipality(e.detail.value);
                  setSelectedBarangay(null); // reset barangay
                }}
              >
                {[...new Set(locationOptions.map((loc) => loc.municipality))].map((mun) => (
                  <IonSelectOption key={mun} value={mun}>
                    {mun}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Barangay</IonLabel>
              <IonSelect
                value={selectedBarangay}
                placeholder="Select barangay"
                onIonChange={(e) => setSelectedBarangay(e.detail.value)}
                disabled={!selectedMunicipality}
              >
                {locationOptions
                  .filter((loc) => loc.municipality === selectedMunicipality)
                  .map((loc) => (
                    <IonSelectOption key={loc.location_id} value={loc.barangay}>
                      {loc.barangay}
                    </IonSelectOption>
                  ))}
              </IonSelect>
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
