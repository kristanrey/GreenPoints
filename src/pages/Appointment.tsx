// src/pages/AppointmentPage.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonDatetime,
  IonButton,
  IonToast,
  IonSpinner,
  IonList,
  IonBadge,
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

const AppointmentPage: React.FC = () => {
  const [groupName, setGroupName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [schedule, setSchedule] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fetching, setFetching] = useState(true);

  // Fetch user's appointments
  const fetchAppointments = async () => {
    setFetching(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (user) {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setAppointments(data as Appointment[]);
      }
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!groupName || !contactNumber || !appointmentMessage || !schedule) {
      setToastMessage("Please fill in all fields.");
      setShowToast(true);
      return;
    }

    setLoading(true);

    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;

    if (userError || !user) {
      setToastMessage("You must be logged in to create an appointment.");
      setShowToast(true);
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("appointments").insert([
      {
        user_id: user.id,
        group_name: groupName,
        contact_number: contactNumber,
        appointment_message: appointmentMessage,
        schedule: schedule ? new Date(schedule).toISOString() : null,
        created_at: new Date().toISOString(),
        status: "pending", // new field
      },
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      setToastMessage("Error saving appointment: " + (error.message ?? "Unknown error"));
    } else {
      setToastMessage("Appointment reserved successfully!");
      setGroupName("");
      setContactNumber("");
      setAppointmentMessage("");
      setSchedule(null);
      fetchAppointments(); // refresh list after insert
    }

    setShowToast(true);
    setLoading(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reserve Tree Planting Appointment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* FORM */}
        <IonItem>
          <IonLabel position="floating">Group Name</IonLabel>
          <IonInput
            value={groupName}
            onIonChange={(e) => setGroupName(e.detail.value ?? "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Contact Number</IonLabel>
          <IonInput
            type="tel"
            value={contactNumber}
            onIonChange={(e) => setContactNumber(e.detail.value ?? "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Appointment Message</IonLabel>
          <IonTextarea
            value={appointmentMessage}
            onIonChange={(e) => setAppointmentMessage(e.detail.value ?? "")}
            autoGrow={true}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="floating">Schedule</IonLabel>
          <IonDatetime
            presentation="date-time"
            value={schedule ?? undefined}
            onIonChange={(e) => {
              const value = e.detail.value as string | string[] | null;
              setSchedule(Array.isArray(value) ? value[0] ?? null : value);
            }}
          />
        </IonItem>

        <IonButton
          expand="block"
          className="ion-margin-top"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <IonSpinner name="crescent" /> : "Reserve Appointment"}
        </IonButton>

        {/* LIST OF USER'S APPOINTMENTS */}
        <h2 style={{ marginTop: "20px" }}>My Appointments</h2>
        {fetching ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonList>
            {appointments.length === 0 ? (
              <IonItem>
                <IonLabel>No appointments found.</IonLabel>
              </IonItem>
            ) : (
              appointments.map((appt) => (
                <IonItem key={appt.appointment_id}>
                  <IonLabel className="ion-text-wrap">
                    <h2>
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
                    </h2>
                    <p>📞 {appt.contact_number}</p>
                    <p>{appt.appointment_message}</p>
                    <p>🗓 {new Date(appt.schedule).toLocaleString()}</p>
                  </IonLabel>
                </IonItem>
              ))
            )}
          </IonList>
        )}

        {/* TOAST */}
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

export default AppointmentPage;
