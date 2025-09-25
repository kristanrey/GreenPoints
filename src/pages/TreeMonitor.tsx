import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonSpinner,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

/** Haversine distance in meters */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MonitorTree: React.FC<{ submission: any }> = ({ submission }) => {
  const [user, setUser] = useState<any | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // fetch current user from Supabase and listen to auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch (err) {
        console.error("getUser error", err);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      // unsubscribe listener if present
      try {
        // @ts-ignore
        listener?.subscription?.unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  // Use exifr.gps(file) directly (exifr accepts File/Blob)
  const getGpsFromImage = async (file: File): Promise<{ lat: number; lon: number } | null> => {
    try {
      const exifr = await import("exifr");
      const exifData = await exifr.gps(file as any);
      if (exifData?.latitude && exifData?.longitude) {
        return { lat: exifData.latitude, lon: exifData.longitude };
      }
      return null;
    } catch (err) {
      console.error("EXIF parse error:", err);
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!submission) {
      setToastMessage("No submission selected.");
      return;
    }
    if (!user) {
      setToastMessage("Please sign in before monitoring.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setLoading(true);

    // 1) extract gps
    const gps = await getGpsFromImage(file);
    if (!gps) {
      setToastMessage("❌ No GPS in image. Enable location when taking photos.");
      setLoading(false);
      return;
    }

    // 2) compare with registered tree location (1 meter tolerance)
    const distance = getDistance(
      Number(submission.latitude),
      Number(submission.longitude),
      gps.lat,
      gps.lon
    );

    const status = distance <= 1 ? "Valid" : "Invalid";
    setToastMessage(status === "Valid" ? "✅ Location verified (≤ 1 m)." : `❌ Not within 1 m (distance: ${distance.toFixed(2)} m)`);

    try {
      // 3) upload to Supabase Storage
      // ensure you have a bucket named 'tree-images' in Supabase
      const ext = file.name.split(".").pop();
      const filePath = `monitoring/${user.id}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tree-images")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // try upsert true if file exists
        const { data: upsertData, error: upsertError } = await supabase.storage
          .from("tree-images")
          .upload(filePath, file, { upsert: true });
        if (upsertError) {
          setToastMessage("❌ Upload failed.");
          setLoading(false);
          return;
        }
      }

      const { data: publicUrlData } = supabase.storage.from("tree-images").getPublicUrl(filePath);
      const imageUrl = publicUrlData?.publicUrl ?? "";

      // 4) insert into tree_monitoring table
      const { error: insertError } = await supabase.from("tree_monitoring").insert([
        {
          submission_id: submission.submission_id,
          user_id: user.id,
          latitude: gps.lat,
          longitude: gps.lon,
          image_url: imageUrl,
          status: status,
        },
      ]);

      if (insertError) {
        console.error("Insert error:", insertError);
        setToastMessage("❌ Could not save monitoring record.");
        setLoading(false);
        return;
      }

      // done
    } catch (err) {
      console.error("Monitoring flow error:", err);
      setToastMessage("❌ Unexpected error. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Monitor Tree</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Registered Tree</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {submission?.image_url && <IonImg src={submission.image_url} />}
            <p>📍 Lat: {submission?.latitude}, Lon: {submission?.longitude}</p>
            <p>🌱 Type: {submission?.tree_type}</p>
          </IonCardContent>
        </IonCard>

        <IonButton expand="block">
          <label style={{ width: "100%" }}>
            Take/Upload Monitoring Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleImageUpload}
            />
          </label>
        </IonButton>

        {loading && <IonSpinner className="ion-margin" />}

        {preview && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Preview</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonImg src={preview} />
            </IonCardContent>
          </IonCard>
        )}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={5000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default MonitorTree;
