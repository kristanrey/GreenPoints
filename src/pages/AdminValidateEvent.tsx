// src/pages/AdminValidateEvent.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

// 🔹 Status type
type StatusType = "approved" | "rejected" | "pending";

// 🔹 Response interface
interface Response {
  response_id: number;
  event_id: number;
  user_id: string;
  username: string;
  photo: string;
  points: number;
  status: StatusType;
  created_at: string;
}

const AdminValidateEvent: React.FC = () => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch all event responses
  const fetchResponses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("event_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching responses:", error);
    } else {
      setResponses(data || []);
    }
    setLoading(false);
  };

  // 🔹 Handle approve/reject
  const handleValidation = async (
    response_id: number,
    newStatus: StatusType
  ) => {
    try {
      const response = responses.find((r) => r.response_id === response_id);
      if (!response) throw new Error("Response not found");

      // 🔹 Keep dynamic points from submission; reset to 0 if rejected
      let points = response.points;
      if (newStatus === "rejected") points = 0;

      // Update the response status and points directly in event_responses table
      const { error } = await supabase
        .from("event_responses")
        .update({ status: newStatus, points })
        .eq("response_id", response_id);

      if (error) throw error;

      setToastMsg(`Submission ${newStatus} successfully`);
      fetchResponses();
    } catch (err: any) {
      console.error("Validation error:", err);
      setToastMsg(`Validation failed: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Validation</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading && <IonSpinner name="crescent" />}

        {!loading && responses.length === 0 && <p>No submissions available.</p>}

        {responses.map((r) => (
          <IonCard key={r.response_id}>
            <IonCardHeader>
              <IonCardTitle>{r.username}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {/* Small image */}
              <IonImg
                src={r.photo}
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <IonButton
                  expand="block"
                  color={r.status === "approved" ? "success" : "medium"}
                  disabled={r.status === "approved"}
                  onClick={() => handleValidation(r.response_id, "approved")}
                >
                  {r.status === "approved" ? "Approved" : "Approve"}
                </IonButton>

                <IonButton
                  expand="block"
                  color={r.status === "rejected" ? "danger" : "medium"}
                  disabled={r.status === "rejected"}
                  onClick={() => handleValidation(r.response_id, "rejected")}
                >
                  {r.status === "rejected" ? "Rejected" : "Reject"}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        ))}

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setToastMsg("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminValidateEvent;
