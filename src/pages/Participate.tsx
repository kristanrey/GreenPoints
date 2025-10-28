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

  // 🔹 Fetch logged-in user
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

  // 🔹 Fetch upcoming event
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
        checkRegistration(data.event_id);
        checkDailyPicture(data.event_id);
        fetchUserPoints(data.event_id); // ✅ Fetch user's points
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setToastMsg("Error fetching event.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Check if user registered for event
  const checkRegistration = async (eventId: number) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) console.error("Registration check error:", error.message);
    setIsRegistered(!!data);
  };

  // 🔹 Check if user already took picture today
  const checkDailyPicture = async (eventId: number) => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("event_responses")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId);
    const hasTaken = data?.some(
      (r) => r.created_at && r.created_at.startsWith(today)
    );
    setHasTakenToday(!!hasTaken);
  };

  // 🔹 Fetch user's total points for the event
  const fetchUserPoints = async (eventId: number) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("event_responses")
        .select("points")
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user points:", error.message);
        return;
      }

      const totalPoints = data?.reduce((sum, r) => sum + (r.points || 0), 0) || 0;
      setPoints(totalPoints);
    } catch (err) {
      console.error("Fetch points error:", err);
    }
  };

  // 🔹 Countdown timer
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
    if (ms <= 0) return "Event ended";
    const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const s = Math.floor((ms / 1000) % 60);
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    if (userId) fetchEvent();
  }, [userId]);

  // 🔹 Calculate points based on submission time
  const calculatePoints = (eventStart: string) => {
    const now = Date.now();
    const start = new Date(eventStart).getTime();
    const elapsedMinutes = (now - start) / 1000 / 60;

    if (elapsedMinutes <= 10) return 50;
    const extraMinutes = elapsedMinutes - 10;
    const decrementSteps = Math.floor(extraMinutes / 2);
    const points = 50 - decrementSteps * 5;
    return points >= 25 ? points : 25;
  };

  // 🔹 Take picture handler
  const handleTakePicture = () => {
    if (!isRegistered) {
      setShowRegisterModal(true);
      return;
    }
    if (hasTakenToday) {
      setToastMsg("You already submitted a picture today!");
      return;
    }
    document.getElementById("imageUpload")?.click();
  };

  // 🔹 Upload image
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

      const earnedPoints = calculatePoints(event.date);

      const { error: insertError } = await supabase.from("event_responses").insert([
        {
          event_id: event.event_id,
          user_id: userId,
          username,
          photo: photoUrl,
          points: earnedPoints,
        },
      ]);

      if (insertError) throw insertError;

      setHasTakenToday(true);
      setToastMsg(`Photo submitted successfully! You earned ${earnedPoints} points.`);
      fetchUserPoints(event.event_id); // update points

    } catch (err: any) {
      console.error("Error:", err.message);
      setToastMsg(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchEvent();
    event.detail.complete();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
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

      <IonContent className="ion-padding ion-text-center">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* 🌿 Points Card */}
        <IonCard className="ion-margin-top" style={{ textAlign: "center" }}>
          <IonCardContent>
            <IonIcon icon={leaf} style={{ fontSize: "30px", color: "green" }} />
            <IonText style={{ fontSize: "28px", fontWeight: "bold", color: "green" }}>
              {points}
            </IonText>
            <IonText color="medium" style={{ display: "block" }}>
              Event Points
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* 🪴 Event Details */}
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
          <IonText color={canParticipate ? "success" : "danger"}>⏳ {timeLeft}</IonText>
        )}

        {/* 📸 Take Picture Button */}
        {canParticipate && event && (
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

        {/* 🔒 Register Modal */}
        <IonModal isOpen={showRegisterModal} onDidDismiss={() => setShowRegisterModal(false)}>
          <IonContent className="ion-padding ion-text-center">
            <IonText color="danger" style={{ fontSize: "18px" }}>
              Please register for this event first!
            </IonText>
            <IonButton expand="block" className="ion-margin-top" onClick={() => setShowRegisterModal(false)}>
              Close
            </IonButton>
          </IonContent>
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
