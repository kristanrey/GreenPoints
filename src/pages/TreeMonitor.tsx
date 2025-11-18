// src/pages/MySubmissions.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonToast,
  IonSpinner,
  IonImg,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router";
import { supabase } from "../utils/supabaseClient";

interface Submission {
  submission_id: number;
  user_id: string;
  image_url: string;
  tree_type: string;
  tree_name?: string;
  barangay?: string;
  municipality?: string;
  date_planted: string;
  location_description: string;
  latitude: number;
  longitude: number;
  status: string;
  exif_metadata?: any;
  visits?: number;
}

const MAX_VISITS = 1;

const MySubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [userName, setUserName] = useState("");

  // Filter states
  const [filterMunicipality, setFilterMunicipality] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [filterTreeName, setFilterTreeName] = useState("");

  // Dropdown options
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [allBarangays, setAllBarangays] = useState<{ municipality: string; barangay: string }[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [treeNames, setTreeNames] = useState<string[]>([]);

  const history = useHistory();
  const location = useLocation<{ fromTakePicture?: boolean }>();

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setToastMsg("⚠️ Please login first");
          setShowToast(true);
          history.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();

        setUserName(profile?.full_name || user.user_metadata?.full_name || user.email || "User");

        await fetchFilterOptions();
        fetchApprovedSubmissions();
      } catch (err: any) {
        setToastMsg(`Error: ${err.message}`);
        setShowToast(true);
        history.push("/login");
      }
    };

    checkUserAccess();
  }, [history]);

  useEffect(() => {
    if (location.state?.fromTakePicture) {
      fetchApprovedSubmissions();
    }
  }, [location.state]);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const { data: locationData } = await supabase.from("locations").select("municipality, barangay");
      const { data: treeData } = await supabase.from("trees").select("tree_name");

      setMunicipalities(Array.from(new Set(locationData?.map((l: any) => l.municipality).filter(Boolean))));
      setAllBarangays(locationData || []);
      setBarangays(Array.from(new Set(locationData?.map((l: any) => l.barangay).filter(Boolean))));
      setTreeNames(Array.from(new Set(treeData?.map((t: any) => t.tree_name).filter(Boolean))));
    } catch (err: any) {
      console.error("Error fetching filter options:", err);
    }
  };

  // Update barangays based on selected municipality
  useEffect(() => {
    if (!filterMunicipality) {
      setBarangays(Array.from(new Set(allBarangays.map(b => b.barangay))));
      setFilterBarangay(""); // Reset barangay filter
    } else {
      setBarangays(
        Array.from(
          new Set(allBarangays.filter(b => b.municipality === filterMunicipality).map(b => b.barangay))
        )
      );
      setFilterBarangay(""); // Reset barangay filter when municipality changes
    }
  }, [filterMunicipality, allBarangays]);

  const fetchApprovedSubmissions = async () => {
    setLoading(true);
    try {
      const { data: submissionsData, error } = await supabase
        .from("tree_submissions")
        .select("*")
        .ilike("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsedData = await Promise.all(
        (submissionsData || []).map(async (sub: any) => {
          const exif = sub.exif_metadata ? JSON.parse(sub.exif_metadata) : null;

          const finalLat = exif?.latitude ?? sub.latitude;
          const finalLng = exif?.longitude ?? sub.longitude;

          const { count } = await supabase
            .from("tree_monitoring")
            .select("*", { count: "exact", head: true })
            .eq("submission_id", sub.submission_id);

          return {
            ...sub,
            submission_id: sub.submission_id ?? sub.id, // fallback if DB uses "id"
            tree_name: exif?.tree_name || sub.tree_name || "Unknown Tree",
            barangay: exif?.barangay || sub.barangay || "Unknown Barangay",
            municipality: exif?.municipality || sub.municipality || "Unknown Municipality",
            exif_metadata: exif,
            latitude: finalLat,
            longitude: finalLng,
            visits: count || 0,
          };
        })
      );

      setSubmissions(parsedData);
    } catch (err: any) {
      setToastMsg(`Error fetching submissions: ${err.message}`);
      setShowToast(true);
    }
    setLoading(false);
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchMunicipality = filterMunicipality ? s.municipality === filterMunicipality : true;
    const matchBarangay = filterBarangay ? s.barangay === filterBarangay : true;
    const matchTreeName = filterTreeName ? s.tree_name === filterTreeName : true;
    return matchMunicipality && matchBarangay && matchTreeName;
  });

  // DMS conversion
  const toDMS = (deg: number, type: "lat" | "lon") => {
    if (!deg) return "N/A";
    const d = Math.floor(Math.abs(deg));
    const m = Math.floor((Math.abs(deg) - d) * 60);
    const s = ((Math.abs(deg) - d - m / 60) * 3600).toFixed(2);
    const dir = type === "lat" ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
    return `${d}° ${m}' ${s}" ${dir}`;
  };

  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const incrementVisits = async (submission: Submission) => {
    if ((submission.visits || 0) >= MAX_VISITS) return;

    try {
      const { error } = await supabase.from("tree_monitoring").insert([
        {
          submission_id: submission.submission_id,
          user_id: submission.user_id,
          latitude: submission.latitude,
          longitude: submission.longitude,
          image_url: "",
          monitored_at: new Date().toISOString(),
          condition: "Growing",
          notes: "",
          visits: (submission.visits || 0) + 1,
        },
      ]);
      if (error) throw error;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.submission_id === submission.submission_id
            ? { ...s, visits: (s.visits || 0) + 1 }
            : s
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleFind = (sub: Submission) => {
    const { latitude, longitude } = sub;
    if (!latitude || !longitude) return;

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const distance = getDistanceMeters(pos.coords.latitude, pos.coords.longitude, latitude, longitude);
        if (distance <= 1) setToastMsg("🎉 You are at the tree location! 🌳");
        setShowToast(true);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${latitude},${longitude}`;
        window.open(mapsUrl, "_blank");
        incrementVisits(sub);
      },
      () => {
        setToastMsg("⚠️ Could not detect location");
        setShowToast(true);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank");
        incrementVisits(sub);
      }
    );
  };

  const handleTakePicture = (sub: Submission) => {
    history.push(`/take-picture/${sub.submission_id}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Approved Trees</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear"> 👤 {userName || "Loading..."} </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <IonItem>
            <IonLabel>Municipality</IonLabel>
            <IonSelect
              value={filterMunicipality}
              placeholder="Select Municipality"
              onIonChange={e => setFilterMunicipality(e.detail.value)}
            >
              {municipalities.map(m => <IonSelectOption key={m} value={m}>{m}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>Barangay</IonLabel>
            <IonSelect
              value={filterBarangay}
              placeholder="Select Barangay"
              onIonChange={e => setFilterBarangay(e.detail.value)}
            >
              {barangays.map(b => <IonSelectOption key={b} value={b}>{b}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>Tree Name</IonLabel>
            <IonSelect
              value={filterTreeName}
              placeholder="Select Tree"
              onIonChange={e => setFilterTreeName(e.detail.value)}
            >
              {treeNames.map(t => <IonSelectOption key={t} value={t}>{t}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonButton
            onClick={() => {
              setFilterMunicipality("");
              setFilterBarangay("");
              setFilterTreeName("");
              setBarangays(Array.from(new Set(allBarangays.map(b => b.barangay))));
            }}
          >
            Reset
          </IonButton>
        </div>

        {loading ? (
          <IonSpinner name="crescent" />
        ) : filteredSubmissions.length === 0 ? (
          <p>No approved submissions match the filter 🌱</p>
        ) : (
          filteredSubmissions.map(sub => (
            <IonCard key={sub.submission_id} style={{ padding: "16px" }}>
              <IonCardHeader>
                <IonCardTitle>Approved Tree</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {sub.image_url ? <IonImg src={sub.image_url} style={{ maxWidth: "400px", borderRadius: "8px" }} /> : <p>📷 Image not available</p>}
                <p>{sub.tree_type}</p>
                <table>
                  <tbody>
                    <tr><td><b>Tree Name</b></td><td>{sub.tree_name}</td></tr>
                    <tr><td><b>Barangay</b></td><td>{sub.barangay}</td></tr>
                    <tr><td><b>Municipality</b></td><td>{sub.municipality}</td></tr>
                  </tbody>
                </table>
                <IonButton expand="block" color="success">👣 Visits: {sub.visits || 0}/{MAX_VISITS}</IonButton>
                <IonButton expand="block" color="tertiary" onClick={() => handleFind(sub)}>📍 Location</IonButton>
                <IonButton
                  expand="block"
                  color="primary"
                  disabled={(sub.visits || 0) >= MAX_VISITS}
                  onClick={() => handleTakePicture(sub)}
                >
                  📸 Take Picture
                </IonButton>
              </IonCardContent>
            </IonCard>
          ))
        )}

        <IonToast isOpen={showToast} message={toastMsg} duration={2000} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default MySubmissions;
