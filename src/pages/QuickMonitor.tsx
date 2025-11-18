import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom GPS marker icon
const gpsIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // GPS pin icon
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -35],
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

interface Submission {
  submission_id: number;
  tree_name: string;
  municipality: string;
  barangay: string;
  image_url: string;
  date_planted: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

const centerDefault: [number, number] = [8.349, 125.0]; // Default map center

const ApprovedSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");
  const [showMap, setShowMap] = useState(false);
  const [satelliteView, setSatelliteView] = useState(false);

  // Fetch municipalities
  useEffect(() => {
    const fetchMunicipalities = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("municipality")
        .order("municipality", { ascending: true });
      if (error) console.error("Error fetching municipalities:", error);
      else {
        const unique = Array.from(
          new Set(data?.map((item) => item.municipality))
        );
        setMunicipalities(unique);
      }
    };
    fetchMunicipalities();
  }, []);

  // Fetch barangays
  useEffect(() => {
    const fetchBarangays = async () => {
      if (!selectedMunicipality) {
        setBarangays([]);
        return;
      }
      const { data, error } = await supabase
        .from("locations")
        .select("barangay")
        .eq("municipality", selectedMunicipality)
        .order("barangay", { ascending: true });
      if (error) console.error("Error fetching barangays:", error);
      else setBarangays(data?.map((item) => item.barangay) || []);
    };
    fetchBarangays();
    setSelectedBarangay("");
  }, [selectedMunicipality]);

  // Fetch approved submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      let query = supabase.from("tree_submissions").select("*").eq("status", "approved");
      if (selectedMunicipality) query = query.eq("municipality", selectedMunicipality);
      if (selectedBarangay) query = query.eq("barangay", selectedBarangay);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching submissions:", error);
        setSubmissions([]);
      } else setSubmissions(data || []);
      setLoading(false);
    };
    fetchSubmissions();
  }, [selectedMunicipality, selectedBarangay]);

  const handleShowMap = () => {
    setShowMap(true);
  };

  const toggleSatellite = () => {
    setSatelliteView((prev) => !prev);
  };

  // Determine map center
  const mapCenter: [number, number] = submissions.find(
    (s) => s.latitude && s.longitude
  )
    ? [
        submissions.find((s) => s.latitude && s.longitude)!.latitude!,
        submissions.find((s) => s.latitude && s.longitude)!.longitude!,
      ]
    : centerDefault;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Approved Submissions</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Filters */}
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeSm="6">
              <IonItem>
                <IonLabel>Municipality</IonLabel>
                <IonSelect
                  value={selectedMunicipality}
                  placeholder="Select Municipality"
                  onIonChange={(e) => setSelectedMunicipality(e.detail.value)}
                >
                  {municipalities.map((muni) => (
                    <IonSelectOption key={muni} value={muni}>
                      {muni}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>

            <IonCol size="12" sizeSm="6">
              <IonItem>
                <IonLabel>Barangay</IonLabel>
                <IonSelect
                  value={selectedBarangay}
                  placeholder="Select Barangay"
                  onIonChange={(e) => setSelectedBarangay(e.detail.value)}
                  disabled={!selectedMunicipality}
                >
                  {barangays.map((bgy) => (
                    <IonSelectOption key={bgy} value={bgy}>
                      {bgy}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Map Controls */}
        <IonButton
          expand="block"
          onClick={handleShowMap}
          disabled={!selectedBarangay}
          style={{ marginBottom: "10px" }}
        >
          Show on Map
        </IonButton>

        {showMap && (
          <IonButton
            expand="block"
            onClick={toggleSatellite}
            style={{ marginBottom: "20px" }}
          >
            {satelliteView ? "Switch to Street Map" : "Switch to Satellite"}
          </IonButton>
        )}

        {/* Map Section */}
        {showMap && (
          <div style={{ margin: "20px 0" }}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer
                url={
                  satelliteView
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
                attribution={
                  satelliteView
                    ? 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                    : '&copy; OpenStreetMap contributors'
                }
              />

              {submissions
                .filter((sub) => sub.latitude && sub.longitude)
                .map((sub) => (
                  <Marker
                    key={sub.submission_id}
                    position={[sub.latitude!, sub.longitude!]}
                    icon={gpsIcon} // Use custom GPS icon
                  >
                    <Popup>
                      <strong>{sub.tree_name}</strong>
                      <br />
                      {sub.date_planted}
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        )}

        {/* Submissions List */}
        {loading ? (
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 50 }}
          >
            <IonSpinner name="dots" />
          </div>
        ) : submissions.length === 0 ? (
          <IonText color="medium">No approved submissions found.</IonText>
        ) : (
          submissions.map((sub) => (
            <IonCard
              key={sub.submission_id}
              style={{
                marginBottom: 20,
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              {sub.image_url && (
                <img
                  src={sub.image_url}
                  alt={sub.tree_name}
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 200,
                    objectFit: "cover",
                  }}
                />
              )}
              <IonCardHeader style={{ paddingBottom: 4 }}>
                <IonCardTitle style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                  {sub.tree_name}
                </IonCardTitle>
                <p style={{ margin: "2px 0", fontSize: "0.9rem", color: "#666" }}>
                  {sub.municipality} - {sub.barangay}
                </p>
                <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#888" }}>
                  Date Planted: {sub.date_planted}
                </p>
                {sub.latitude && sub.longitude && (
                  <p style={{ margin: "2px 0", fontSize: "0.85rem", color: "#888" }}>
                    GPS: {sub.latitude.toFixed(6)}, {sub.longitude.toFixed(6)}
                  </p>
                )}
              </IonCardHeader>
              <IonCardContent>
                <p style={{ fontSize: "0.95rem", color: "#444" }}>
                  {sub.description}
                </p>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default ApprovedSubmissions;
