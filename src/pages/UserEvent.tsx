// src/pages/UserEvents.tsx
import React, { useEffect, useState } from "react";
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonButton } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const UserEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const userId = localStorage.getItem("user_id");

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
    setEvents(data || []);
  };

  const fetchRegistrations = async () => {
    const { data } = await supabase.from("event_registrations").select("*");
    setRegistrations(data || []);
  };

  const registerEvent = async (ev: any) => {
    const registeredCount = registrations.filter(r => r.event_id === ev.event_id && r.status === "approved").length;
    
    if (ev.registration_type === "limited" && ev.max_participants && registeredCount >= ev.max_participants) {
      alert("This event is full!");
      return;
    }

    // Check if user already registered
    const alreadyRegistered = registrations.find(r => r.event_id === ev.event_id && r.user_id === userId);
    if (alreadyRegistered) {
      alert("You already registered for this event.");
      return;
    }

    await supabase.from("event_registrations").insert([{ event_id: ev.event_id, user_id: userId }]);
    alert("Registered successfully!");
    fetchRegistrations();
  };

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Events</h2>
        <IonList>
          {events.map(ev => (
            <IonItem key={ev.event_id}>
              <IonLabel>
                <h3>{ev.title}</h3>
                <p>{ev.description}</p>
                <p>{new Date(ev.date).toLocaleString()}</p>
                <p>{ev.registration_type === "limited" ? `Max Participants: ${ev.max_participants}` : "Open to all"}</p>
              </IonLabel>
              <IonButton onClick={() => registerEvent(ev)}>Register</IonButton>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default UserEvents;
