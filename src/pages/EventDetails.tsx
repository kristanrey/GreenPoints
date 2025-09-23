// src/pages/EventDetails.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

interface Event {
  event_id: number;
  title: string;
  description: string;
  date: string;
  registration_type: string;
  max_participants: number;
  created_by: string;
}

interface RouteParams {
  id: string;
}

const EventDetails: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [registering, setRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState<number | null>(null);

  // ✅ Fetch event details + participant count
  const fetchEventDetails = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", id)
      .single();

    if (error) {
      setToastMessage("Error fetching event details");
      setLoading(false);
      return;
    }

    setEvent(data);

    // ✅ Fetch participant count
    const { count, error: countError } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    if (!countError && count !== null) {
      setRegisteredCount(count);
    }

    // ✅ Check if user is already registered
    const user = (await supabase.auth.getUser()).data.user;
    if (user) {
      const { data: existingReg } = await supabase
        .from("event_registrations")
        .select("registration_id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingReg) {
        setAlreadyRegistered(true);
        setRegistrationId(existingReg.registration_id);
      } else {
        setAlreadyRegistered(false);
        setRegistrationId(null);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  // ✅ Register logic with duplicate check
  const handleRegister = async () => {
    if (!event) return;

    if (registeredCount >= event.max_participants) {
      setToastMessage("Sorry, this event is full.");
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setToastMessage("You must be logged in to register.");
      return;
    }

    // Prevent duplicate registration
    const { data: existingReg } = await supabase
      .from("event_registrations")
      .select("registration_id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReg) {
      setToastMessage("You are already registered for this event.");
      return;
    }

    setRegistering(true);

    const { error } = await supabase.from("event_registrations").insert([
      {
        event_id: event.event_id,
        user_id: user.id,
      },
    ]);

    if (error) {
      setToastMessage("Error registering for event.");
    } else {
      setToastMessage("Successfully registered!");
      fetchEventDetails(); // refresh participant count + registration status
    }

    setRegistering(false);
  };

  // ✅ Cancel registration logic
  const handleCancel = async () => {
    if (!registrationId) return;

    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("registration_id", registrationId);

    if (error) {
      setToastMessage("Error canceling registration.");
    } else {
      setToastMessage("Registration canceled.");
      fetchEventDetails(); // refresh participant count + registration status
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Event Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <IonSpinner />
        ) : event ? (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{event.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p>{event.description}</p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(event.date).toLocaleString()}
                </p>
                <p>
                  <strong>Registration Type:</strong>{" "}
                  {event.registration_type}
                </p>
                <p>
                  <strong>Participants:</strong> {registeredCount} /{" "}
                  {event.max_participants}
                </p>
                <p>
                  <strong>Spots Left:</strong>{" "}
                  {event.max_participants - registeredCount}
                </p>
              </IonText>

              {!alreadyRegistered ? (
                <IonButton
                  expand="block"
                  onClick={handleRegister}
                  disabled={
                    registeredCount >= event.max_participants || registering
                  }
                >
                  {registeredCount >= event.max_participants
                    ? "Event Full"
                    : registering
                    ? "Registering..."
                    : "Register"}
                </IonButton>
              ) : (
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={handleCancel}
                >
                  Cancel Registration
                </IonButton>
              )}
            </IonCardContent>
          </IonCard>
        ) : (
          <IonText>No event found.</IonText>
        )}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default EventDetails;
