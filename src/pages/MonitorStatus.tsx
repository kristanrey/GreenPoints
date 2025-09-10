// src/pages/MonitorStatus.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonText,
  IonProgressBar,
  IonIcon,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { flame, checkmarkCircle } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";


const MILESTONES = [
  { days: 7, reward: 20 },
  { days: 30, reward: 100 },
  { days: 100, reward: 300 }, // 🏆 bigger bonus
];

const MonitorStatus: React.FC = () => {
  const [streak, setStreak] = useState(0);
  const [lastSubmission, setLastSubmission] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStreak = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // ✅ Fetch user's submissions
    const { data, error } = await supabase
      .from("tree_submissions")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (data.length > 0) {
      setLastSubmission(new Date(data[0].created_at).toLocaleDateString());
    }

    // ✅ Calculate streak
    let streakCount = 0;
    let currentDate = new Date();
    for (let i = 0; i < data.length; i++) {
      const submissionDate = new Date(data[i].created_at);
      const diffDays = Math.floor(
        (currentDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0 || diffDays === 1) {
        streakCount++;
        currentDate = submissionDate;
      } else {
        break;
      }
    }

    setStreak(streakCount);

    // ✅ Check if streak reached a milestone
    await checkAndReward(user.id, streakCount);

    setLoading(false);
  };

  // 🎁 Check milestones & reward once
  const checkAndReward = async (userId: string, streakCount: number) => {
    for (const milestone of MILESTONES) {
      if (streakCount === milestone.days) {
        // check if already rewarded
        const { data: rewardData } = await supabase
          .from("streak_rewards")
          .select("*")
          .eq("user_id", userId)
          .eq("milestone", milestone.days)
          .single();

        if (!rewardData) {
          // reward user
          const { error: updateError } = await supabase.rpc("increment_greenpoints", {
            uid: userId,
            points: milestone.reward,
          });

          if (updateError) {
            console.error("Reward error:", updateError);
            return;
          }

          // record reward
          await supabase.from("streak_rewards").insert([
            { user_id: userId, milestone: milestone.days, reward: milestone.reward },
          ]);

          setToastMessage(
            `🎉 Congrats! You reached a ${milestone.days}-day streak and earned +${milestone.reward} GreenPoints!`
          );
        }
      }
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Monitor Status</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" />
          <p>Loading your streak...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Monitor Status</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard className="streak-card">
          <IonCardContent>
            <div className="streak-header">
              <IonIcon icon={flame} className="streak-icon" />
              <IonText className="streak-value">{streak} 🔥</IonText>
            </div>
            <IonText className="streak-label">Current Tree Planting Streak</IonText>
            <IonProgressBar
              value={(streak % 7) / 7}
              color="success"
              className="streak-progress"
            />
            <p className="streak-note">
              {lastSubmission
                ? `Last planted on ${lastSubmission}`
                : "No submissions yet."}
            </p>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardContent>
            <IonText>
              Keep planting trees daily to grow your streak! 🌱 <br />
              Earn bonus GreenPoints when you reach streak milestones:
            </IonText>
            <ul>
              {MILESTONES.map((m) => (
                <li key={m.days}>
                  <IonIcon icon={checkmarkCircle} color="success" /> {m.days}-day
                  streak → +{m.reward} GP
                </li>
              ))}
            </ul>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage || ""}
          duration={4000}
          onDidDismiss={() => setToastMessage(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default MonitorStatus;
