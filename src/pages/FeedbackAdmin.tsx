// src/pages/AdminFeedbackPage.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAvatar,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonSpinner,
} from "@ionic/react";
import { star, starOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

interface Feedback {
  feedback_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const FeedbackAdmin: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("feedback")
        .select(
          `
          feedback_id, rating, comment, created_at, user_id,
          profiles ( username, avatar_url )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching feedback:", error.message);
      } else {
        setFeedbackList(data as unknown as Feedback[]);
      }

      setLoading(false);
    };

    fetchFeedback();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>User Feedback (Admin)</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <IonSpinner name="crescent" />
            <p>Loading feedback...</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <p style={{ textAlign: "center" }}>No feedback submitted yet.</p>
        ) : (
          feedbackList.map((fb) => (
            <IonCard key={fb.feedback_id}>
              <IonItem lines="none">
                <IonAvatar slot="start">
                  <img
                    src={
                      fb.profiles?.avatar_url
                        ? fb.profiles.avatar_url
                        : "https://ionicframework.com/docs/img/demos/avatar.svg"
                    }
                    alt="profile"
                  />
                </IonAvatar>
                <IonLabel>
                  <h2>{fb.profiles?.username || "Unknown User"}</h2>
                  <IonText color="medium" style={{ fontSize: "12px" }}>
                    {new Date(fb.created_at).toLocaleString()}
                  </IonText>
                </IonLabel>
              </IonItem>

              <IonCardHeader>
                <IonCardTitle>
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <IonIcon
                      key={starValue}
                      icon={starValue <= fb.rating ? star : starOutline}
                      style={{ color: "gold", fontSize: "20px" }}
                    />
                  ))}
                </IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                <p>{fb.comment}</p>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default FeedbackAdmin;
