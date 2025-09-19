// src/pages/AdminEvents.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonList,
  IonItem,
  IonLabel,
  IonText
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [registrationType, setRegistrationType] = useState("open");
  const [max, setMax] = useState<number | undefined>();
  const [registrations, setRegistrations] = useState<any[]>([]);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
    setEvents(data || []);
  };

  const fetchRegistrations = async () => {
    const { data } = await supabase.from("event_registrations").select("*");
    setRegistrations(data || []);
  };

  const createEvent = async () => {
    await supabase.from("events").insert([{
      title,
      description: desc,
      date,
      registration_type: registrationType,
      max_participants: registrationType === "limited" ? max : null,
      created_by: localStorage.getItem("user_id")
    }]);
    setTitle(""); setDesc(""); setDate(""); setMax(undefined); setRegistrationType("open");
    fetchEvents();
  };

  const approveUser = async (regId: number) => {
    await supabase.from("event_registrations").update({ status: "approved" }).eq("registration_id", regId);
    fetchRegistrations();
  };

  const rejectUser = async (regId: number) => {
    await supabase.from("event_registrations").update({ status: "rejected" }).eq("registration_id", regId);
    fetchRegistrations();
  };

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Events</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Create Event</h2>
        <IonInput placeholder="Title" value={title} onIonChange={e => setTitle(e.detail.value!)} />
        <IonInput placeholder="Description" value={desc} onIonChange={e => setDesc(e.detail.value!)} />
        <IonInput type="datetime-local" value={date} onIonChange={e => setDate(e.detail.value!)} />
        <IonSelect value={registrationType} onIonChange={e => setRegistrationType(e.detail.value)}>
          <IonSelectOption value="open">All Users Can Participate</IonSelectOption>
          <IonSelectOption value="limited">Limited Participants</IonSelectOption>
        </IonSelect>
        {registrationType === "limited" && (
          <IonInput type="number" placeholder="Max Participants" value={max?.toString()} onIonChange={e => setMax(Number(e.detail.value))} />
        )}
        <IonButton onClick={createEvent}>Create Event</IonButton>

        <h2>Existing Events</h2>
        <IonList>
          {events.map(ev => (
            <IonItem key={ev.event_id}>
              <IonLabel>
                <h3>{ev.title}</h3>
                <p>{ev.description}</p>
                <p>{new Date(ev.date).toLocaleString()}</p>
                <p>{ev.registration_type === "limited" ? `Max: ${ev.max_participants}` : "Open to all"}</p>
                <IonText>
                  Participants:
                  <ul>
                    {registrations.filter(r => r.event_id === ev.event_id).map(r => (
                      <li key={r.registration_id}>
                        {r.user_id} - {r.status}
                        {r.status === "pending" && (
                          <>
                            <IonButton size="small" onClick={() => approveUser(r.registration_id)}>Approve</IonButton>
                            <IonButton size="small" color="danger" onClick={() => rejectUser(r.registration_id)}>Reject</IonButton>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </IonText>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default AdminEvents;
