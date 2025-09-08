// src/pages/FeedbackPage.tsx
import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonTextarea,
  IonIcon,
} from "@ionic/react";
import { star, starOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

const FeedbackPage: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must be logged in to submit feedback.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("feedback").insert([
        {
          user_id: user.id,
          rating,
          comment,
        },
      ]);

      if (error) throw error;

      setMessage("✅ Thank you for your feedback!");
      setRating(0); // reset stars
      setComment(""); // reset comment only after successful submit
    } catch (err: any) {
      setMessage("❌ Error submitting feedback: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonTitle>Rate & Feedback</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Stars */}
        <div
          className="stars-container"
          style={{ textAlign: "center", margin: "20px 0" }}
        >
          {[1, 2, 3, 4, 5].map((starValue) => (
            <IonIcon
              key={starValue}
              icon={starValue <= (hover || rating) ? star : starOutline}
              style={{
                fontSize: "40px",
                color: "gold",
                cursor: "pointer",
                margin: "5px",
              }}
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
            />
          ))}
        </div>

        {/* Comment box */}
        <IonTextarea
          placeholder="Write your feedback..."
          autoGrow
          value={comment}
          debounce={300} // prevents flickering while typing
          onIonInput={(e) => setComment(e.detail.value ?? "")}
          style={{ marginBottom: "20px" }}
        />

        {/* Submit button */}
        <IonButton
          expand="block"
          color="tertiary"
          onClick={handleSubmit}
          disabled={loading || (rating === 0 && comment.trim() === "")}
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </IonButton>

        {message && (
          <p style={{ textAlign: "center", marginTop: "15px" }}>{message}</p>
        )}
      </IonContent>
    </IonPage>
  );
};

export default FeedbackPage;
