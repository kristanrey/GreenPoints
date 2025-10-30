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
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

interface Event {
  event_id: number;
  title: string;
  description: string;
  date: string;
  registration_type: string;
  max_participants: number | null;
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

  const fetchEventDetails = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", id)
      .single();

    if (error || !data) {
      console.error("Error fetching event:", error?.message);
      setToastMessage("Error fetching event details");
      setLoading(false);
      return;
    }

    setEvent(data);

    const { count, error: countError } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    if (!countError && count !== null) {
      setRegisteredCount(count);
    }

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

  const handleRegister = async () => {
    if (!event) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setToastMessage("You must be logged in to register.");
      return;
    }

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

    if (
      event.registration_type === "limited" &&
      event.max_participants !== null &&
      registeredCount >= event.max_participants
    ) {
      setToastMessage("Sorry, this event is full.");
      return;
    }

    setRegistering(true);

    const { error } = await supabase.from("event_registrations").insert([
      {
        event_id: event.event_id,
        user_id: user.id,
        status:
          event.registration_type === "open" ? "approved" : "pending",
      },
    ]);

    if (error) {
      console.error("Registration error:", error.message);
      setToastMessage("Error registering for event.");
    } else {
      setToastMessage("Successfully registered!");
      fetchEventDetails();
    }

    setRegistering(false);
  };

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
      fetchEventDetails();
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
                  {event.registration_type === "open" ? "Open to All" : "Limited"}
                </p>
                {event.registration_type === "limited" && (
                  <>
                    <p>
                      <strong>Participants:</strong> {registeredCount} /{" "}
                      {event.max_participants}
                    </p>
                    <p>
                      <strong>Spots Left:</strong>{" "}
                      {event.max_participants! - registeredCount}
                    </p>
                  </>
                )}
              </IonText>

              {/* ✅ Buttons */}
              {!alreadyRegistered ? (
                <IonButton
                  expand="block"
                  onClick={handleRegister}
                  disabled={registering}
                  className="ion-margin-bottom"
                >
                  {registering ? "Registering..." : "Register"}
                </IonButton>
              ) : (
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={handleCancel}
                  className="ion-margin-bottom"
                >
                  Cancel Registration
                </IonButton>
              )}

              {/* ✅ Back button below */}
              <IonButton expand="block" color="medium" href="/GreenPoints/participate">
                Back
              </IonButton>
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
