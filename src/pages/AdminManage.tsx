// src/pages/ManageSubmissions.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonToast,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface SubmissionSettings {
  id: string;
  is_open: boolean;
  updated_at: string;
}

const ManageSubmissions: React.FC = () => {
  const [settings, setSettings] = useState<SubmissionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("submission_settings")
        .select("*")
        .maybeSingle(); // ✅ handles empty table safely

      if (error) throw error;

      if (!data) {
        // ✅ no row exists → insert default
        const { data: inserted, error: insertError } = await supabase
          .from("submission_settings")
          .insert([{ is_open: false, updated_at: new Date().toISOString() }])
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(inserted);
      } else {
        setSettings(data);
      }
    } catch (err: any) {
      console.error("❌ Fetch error:", err.message);
      setToastMessage("Failed to fetch submission settings.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleSubmissions = async (isOpen: boolean) => {
    try {
      let updated: SubmissionSettings | null = null;

      if (settings) {
        // ✅ update existing row
        const { data, error } = await supabase
          .from("submission_settings")
          .update({ is_open: isOpen, updated_at: new Date().toISOString() })
          .eq("id", settings.id) // use id now that we guarantee it exists
          .select()
          .single();

        if (error) throw error;
        updated = data;
      } else {
        // ✅ if no settings yet, insert new row
        const { data, error } = await supabase
          .from("submission_settings")
          .insert([{ is_open: isOpen, updated_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;
        updated = data;
      }

      setSettings(updated);
      setToastMessage(isOpen ? "✅ Submissions are now OPEN" : "❌ Submissions are CLOSED");
      setShowToast(true);
    } catch (err: any) {
      console.error("❌ Update error:", err.message);
      setToastMessage("Failed to update submission settings.");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Manage Submissions</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
            <IonSpinner name="crescent" />
          </div>
        ) : settings ? (
          <IonCard style={{ textAlign: "center", padding: "20px" }}>
            <IonCardHeader>
              <IonCardTitle>Submission Status</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color={settings.is_open ? "success" : "danger"}>
                <h2 style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {settings.is_open ? "OPEN ✅" : "CLOSED ❌"}
                </h2>
              </IonText>

              <p style={{ marginTop: "10px", fontSize: "0.9rem", color: "gray" }}>
                Last updated: {new Date(settings.updated_at).toLocaleString()}
              </p>

              <div style={{ marginTop: "20px" }}>
                <IonButton
                  expand="block"
                  color="success"
                  onClick={() => toggleSubmissions(true)}
                  disabled={settings.is_open}
                >
                  Open Submissions
                </IonButton>
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={() => toggleSubmissions(false)}
                  disabled={!settings.is_open}
                >
                  Close Submissions
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonText color="medium">
            <p>No settings found in database.</p>
          </IonText>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default ManageSubmissions;
