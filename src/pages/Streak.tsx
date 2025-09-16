import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient"; // adjust path
import "./Streak.css";

interface StreakData {
  current_streak: number;
  best_streak: number;
  days_active: string[];
}

const StreakDisplay: React.FC = () => {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const weekDays = ["F", "Sa", "Su", "M", "Tu", "W", "Th"];

  useEffect(() => {
    const fetchStreak = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setToastMessage("No user logged in.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_streaks")
          .select("current_streak, best_streak, days_active")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        setStreak(data);
      } catch (err: any) {
        console.error("Error fetching streak:", err.message);
        setToastMessage("Error loading streak data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, []);

  return (
    <IonPage>
      <IonContent className="ion-padding streak-content">
        {loading ? (
          <IonSpinner name="crescent" />
        ) : streak ? (
          <>
            {/* Flame Streak Counter */}
            <div className="streak-flame">
              <div className="flame-icon">🔥</div>
              <IonText color="warning" className="streak-number">
                {streak.current_streak}
              </IonText>
              <IonText className="streak-text">day streak!</IonText>
            </div>

            {/* Week Progress */}
            <IonCard className="streak-card">
              <IonCardContent>
                <IonGrid>
                  <IonRow className="day-row">
                    {weekDays.map((day) => (
                      <IonCol key={day} className="day-col">
                        <div
                          className={`day-circle ${
                            streak.days_active.includes(day) ? "active" : ""
                          }`}
                        >
                          ✓
                        </div>
                        <IonText className="day-label">{day}</IonText>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
                <IonText className="streak-note">
                  A <span className="highlight">streak</span> counts how many days
                  you’ve practiced in a row
                </IonText>
              </IonCardContent>
            </IonCard>

            {/* Streak Table */}
            <IonCard className="streak-table">
              <IonCardContent>
                <IonText className="table-title">Streak Stats</IonText>
                <table>
                  <thead>
                    <tr>
                      <th>Current Streak</th>
                      <th>Best Streak</th>
                      <th>Total Active Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{streak.current_streak} days</td>
                      <td>{streak.best_streak} days</td>
                      <td>{streak.days_active.length} days</td>
                    </tr>
                  </tbody>
                </table>
              </IonCardContent>
            </IonCard>
          </>
        ) : (
          <IonText>No streak data found.</IonText>
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

export default StreakDisplay;
