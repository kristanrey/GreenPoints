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
  IonIcon,
  IonModal,
} from "@ionic/react";
import { leaf } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";
import { useHistory } from "react-router-dom";
import "./css/Participate.css";

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
  const [isRegistered, setIsRegistered] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [points, setPoints] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [hasTakenToday, setHasTakenToday] = useState(false);
  const [uploading, setUploading] = useState(false);

  const history = useHistory();

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error fetching user:", error.message);
      else {
        setUserId(data.user?.id || null);
        setUsername(data.user?.email || "Unknown");
      }
    };
    fetchUser();
  }, []);

  // Fetch upcoming event
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
        if (userId) {
          checkRegistration(data.event_id);
          checkDailyPicture(data.event_id);
          fetchUserPoints(data.event_id);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setToastMsg("Error fetching event.");
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async (eventId: number) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) console.error(error.message);
    setIsRegistered(!!data);
  };

  const checkDailyPicture = async (eventId: number) => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("event_responses")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId);
    const hasTaken = data?.some((r) => r.created_at.startsWith(today));
    setHasTakenToday(!!hasTaken);
  };

  const fetchUserPoints = async (eventId: number) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("event_responses")
      .select("points")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .eq("status", "approved");
    if (error) return console.error(error.message);
    const totalPoints = data?.reduce((sum, r) => sum + (r.points || 0), 0) || 0;
    setPoints(totalPoints);
  };

  // Countdown timer
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

  const formatCountdown = (ms: number) => {
    const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const s = Math.floor((ms / 1000) % 60);
    return ms <= 0 ? "Event ended" : `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    if (userId) fetchEvent();
  }, [userId]);

  const calculatePoints = (submissionTime: Date) => {
    if (!event) return 25;
    const eventStart = new Date(event.date).getTime();
    const submission = submissionTime.getTime();
    const diffMinutes = (submission - eventStart) / 60000;

    if (diffMinutes <= 10) return 50;
    let extra = Math.floor((diffMinutes - 10) / 2);
    let points = 50 - extra;
    if (points < 25) points = 25;
    return points;
  };

  const handleTakePicture = () => {
    if (!isRegistered) return setShowRegisterModal(true);
    if (hasTakenToday) return setToastMsg("You already submitted a picture today!");
    document.getElementById("imageUpload")?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event || !userId) return;

    setUploading(true);
    setImagePreview(URL.createObjectURL(file));
    const fileName = `${userId}_${Date.now()}.jpg`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("event_photos")
        .upload(fileName, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicData } = supabase.storage
        .from("event_photos")
        .getPublicUrl(fileName);
      const photoUrl = publicData.publicUrl;

      const points = calculatePoints(new Date());

      const { error: insertError } = await supabase.from("event_responses").insert([
        {
          event_id: event.event_id,
          user_id: userId,
          username,
          photo: photoUrl,
          points,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw insertError;

      setHasTakenToday(true);
      setToastMsg(`Photo submitted! You earned ${points} points (pending approval).`);
      fetchUserPoints(event.event_id);
    } catch (err: any) {
      console.error(err.message);
      setToastMsg(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchEvent();
    event.detail.complete();
  };

  const goToEventPage = () => {
    setShowRegisterModal(false);
    if (event) history.push(`/GreenPoints/events/${event.event_id}`);
  };

  if (loading || !event)
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{event.title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonCard className="ion-margin-top" style={{ textAlign: "center" }}>
          <IonCardContent>
            <IonIcon icon={leaf} style={{ fontSize: "30px", color: "green" }} />
            <IonText style={{ fontSize: "28px", fontWeight: "bold", color: "green" }}>
              {points}
            </IonText>
            <IonText color="medium" style={{ display: "block" }}>
              Approved Points
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{event.title}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>{event.description}</IonText>
            <br />
            <IonText color="medium">📅 Start: {new Date(event.date).toLocaleString()}</IonText>
            <br />
            <IonText color="medium">🕒 End: {new Date(event.end_date).toLocaleString()}</IonText>
          </IonCardContent>
        </IonCard>

        {timeLeft && (
          <IonText color={canParticipate ? "success" : "danger"}>⏳ {timeLeft}</IonText>
        )}

        {canParticipate && (
          <>
            <IonButton
              expand="block"
              className="ion-margin-top"
              onClick={handleTakePicture}
              disabled={uploading}
            >
              {uploading ? <IonSpinner name="dots" /> : "Take Picture"}
            </IonButton>

            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleImageUpload}
            />

            {imagePreview && (
              <IonCard className="ion-margin-top">
                <IonImg src={imagePreview} />
              </IonCard>
            )}
          </>
        )}

        <IonModal
          isOpen={showRegisterModal}
          onDidDismiss={() => setShowRegisterModal(false)}
        >
          {event && (
            <IonContent className="ion-padding ion-text-center">
              <IonText color="danger" style={{ fontSize: "18px" }}>
                Please register for this event first!
              </IonText>

              <IonButton expand="block" className="ion-margin-top" color="success" onClick={goToEventPage}>
                Register
              </IonButton>

              <IonButton
                expand="block"
                className="ion-margin-top"
                onClick={() => setShowRegisterModal(false)}
              >
                Close
              </IonButton>
            </IonContent>
          )}
        </IonModal>

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