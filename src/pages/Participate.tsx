// src/pages/ParticipateEvent.tsx
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
  IonImg,
  IonToast,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import "./Participate.css";

interface Event {
  event_id: number;
  title: string;
  description: string;
  date: string;
  end_date: string;
  registration_type: string;
  max_participants: number;
  created_by: string;
  created_at: string;
}

const ParticipateEvent: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [canParticipate, setCanParticipate] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Fetch the next upcoming event
  const fetchEvent = async () => {
    setLoading(true);
    try {
      const nowISO = new Date().toISOString();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", nowISO)
        .order("date", { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error("Supabase fetch error:", error.message);
        setToastMsg("Failed to fetch event.");
      } else if (!data) {
        setToastMsg("No upcoming events found.");
        setEvent(null);
      } else {
        setEvent(data);

        const now = Date.now();
        const start = new Date(data.date).getTime();
        const end = new Date(data.end_date).getTime();

        if (now >= start && now <= end) {
          setCanParticipate(true);
          setTimeLeft(formatCountdown(end - now));
        } else if (now < start) {
          setCanParticipate(false);
          setTimeLeft(formatCountdown(start - now));
        } else {
          setCanParticipate(false);
          setTimeLeft("Event ended");
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setToastMsg("An error occurred while fetching event.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  // Countdown helper
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "Event ended";

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);

    let str = "";
    if (days > 0) str += `${days}d `;
    if (hours > 0 || days > 0) str += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) str += `${minutes}m `;
    str += `${seconds}s`;

    return str;
  };

  // Live countdown + participation logic
  useEffect(() => {
    if (!event) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(event.date).getTime();
      const end = new Date(event.end_date).getTime();

      if (now < start) {
        setCanParticipate(false);
        setTimeLeft(`Event starts in ${formatCountdown(start - now)}`);
      } else if (now >= start && now <= end) {
        setCanParticipate(true);
        setTimeLeft(`Event ends in ${formatCountdown(end - now)}`);
      } else {
        setCanParticipate(false);
        setTimeLeft("Event ended");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setToastMsg("Image ready to upload!");
  };

  // Pull-to-refresh handler
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchEvent();
    event.detail.complete();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{event?.title || "Event Details"}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {event ? (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{event.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>{event.description}</IonText>
              <br />
              <IonText color="medium">
                📅 Start: {new Date(event.date).toLocaleString()}
              </IonText>
              <br />
              <IonText color="medium">
                🕒 End: {new Date(event.end_date).toLocaleString()}
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonText color="medium">No upcoming events.</IonText>
        )}

        {timeLeft && (
          <IonText color={canParticipate ? "success" : "danger"}>
            ⏳ {timeLeft}
          </IonText>
        )}

        {canParticipate && event && (
          <>
            <IonButton expand="block" className="ion-margin-top">
              <label style={{ width: "100%" }}>
                Take Picture
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={handleImageUpload}
                />
              </label>
            </IonButton>

            {imagePreview && (
              <IonCard className="ion-margin-top">
                <IonImg src={imagePreview} />
              </IonCard>
            )}
          </>
        )}

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={3000}
          onDidDismiss={() => setToastMsg("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default ParticipateEvent;
