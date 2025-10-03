// src/pages/AdminAppointments.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface Appointment {
  appointment_id: number;
  group_name: string;
  contact_number: string;
  appointment_message: string;
  schedule: string;
  created_at: string;
  status: string;
}

const AdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setToastMessage("Error fetching appointments.");
      setShowToast(true);
    } else {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  };

  // Update appointment status
  const updateStatus = async (id: number, status: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("appointment_id", id);

    if (error) {
      console.error(error);
      setToastMessage("Error updating appointment.");
    } else {
      setToastMessage(`Appointment ${status}!`);
      fetchAppointments(); // refresh list
    }
    setShowToast(true);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filtered list
  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter((appt) => appt.status === filter);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Admin - Manage Appointments</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Filter Bar */}
        <IonSegment
          value={filter}
          onIonChange={(e) => setFilter(e.detail.value as any)}
        >
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="pending">
            <IonLabel>Pending</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="approved">
            <IonLabel>Approved</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="rejected">
            <IonLabel>Rejected</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div className="ion-text-center" style={{ marginTop: "2rem" }}>
            <IonSpinner name="crescent" />
            <p>Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="ion-text-center" style={{ marginTop: "2rem" }}>
            <p>No {filter !== "all" ? filter : ""} appointments found.</p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <IonCard key={appt.appointment_id} className="ion-margin-bottom">
              <IonCardHeader>
                <IonCardTitle>
                  {appt.group_name}{" "}
                  <IonBadge
                    color={
                      appt.status === "approved"
                        ? "success"
                        : appt.status === "rejected"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {appt.status}
                  </IonBadge>
                </IonCardTitle>
                <IonCardSubtitle>📞 {appt.contact_number}</IonCardSubtitle>
              </IonCardHeader>

              <IonCardContent>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "6px 8px", width: "30%" }}>
                        Message:
                      </td>
                      <td style={{ padding: "6px 8px" }}>{appt.appointment_message}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "6px 8px" }}>
                        Schedule:
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        {new Date(appt.schedule).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "6px 8px" }}>
                        Submitted:
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        {new Date(appt.created_at).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {appt.status === "pending" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "10px",
                    }}
                  >
                    <IonButton
                      size="small"
                      color="success"
                      onClick={() =>
                        updateStatus(appt.appointment_id, "approved")
                      }
                    >
                      Approve
                    </IonButton>
                    <IonButton
                      size="small"
                      color="danger"
                      onClick={() =>
                        updateStatus(appt.appointment_id, "rejected")
                      }
                    >
                      Reject
                    </IonButton>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          ))
        )}

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2500}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminAppointments;
