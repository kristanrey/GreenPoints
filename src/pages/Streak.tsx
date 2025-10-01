// src/pages/Streak.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonIcon,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { checkmarkCircle } from "ionicons/icons";

const Streak: React.FC = () => {
  const [today, setToday] = useState(new Date());
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [streakDays, setStreakDays] = useState<number>(0);

  // Update "today" every minute
  useEffect(() => {
    const timer = setInterval(() => setToday(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const year = today.getFullYear();
  const month = today.getMonth(); // 0 = Jan
  const monthName = today.toLocaleString("default", { month: "long" });
  const dayToday = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Fetch streak data from user_streaks table
  useEffect(() => {
    const fetchUserStreaks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      // Fetch all logins for this month
      const { data, error } = await supabase
        .from("user_streaks")
        .select("login_date, points_earned, streak_day")
        .eq("user_id", user.id)
        .gte("login_date", startOfMonth)
        .lte("login_date", endOfMonth);

      if (error) {
        console.error("Error fetching user streaks:", error);
        return;
      }

      // Map login dates to days of month
      const days = data.map((entry) => new Date(entry.login_date).getDate()).sort((a, b) => a - b);
      setCompletedDays(days);

      // Compute total points and current streak
      const totalPoints = data.reduce((acc, entry) => acc + (entry.points_earned || 0), 0);
      setPoints(totalPoints);

      // Current streak = max streak_day for this month
      const maxStreakDay = data.length ? Math.max(...data.map((entry) => entry.streak_day || 0)) : 0;
      setStreakDays(maxStreakDay);
    };

    fetchUserStreaks();
  }, [year, month]);

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        {/* Header with flame, streak days and points */}
        <div
          style={{
            fontSize: "80px",
            color: "orange",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          🔥
          <IonText
            color="warning"
            style={{ marginLeft: "10px", fontSize: "24px", fontWeight: "bold" }}
          >
            {points.toFixed(1)} pts
          </IonText>
        </div>

        <IonText>
          <p style={{ marginTop: "-10px", fontSize: "18px" }}>
            Current streak: <strong>{streakDays}</strong> day{streakDays !== 1 ? "s" : ""}
          </p>
        </IonText>

        {/* Month + Year */}
        <IonText color="warning">
          <h1 style={{ fontSize: "36px", margin: 0 }}>
            {monthName} {year}
          </h1>
        </IonText>
        <IonText>
          <h2 style={{ marginTop: "-10px" }}>Your streak calendar</h2>
        </IonText>

        {/* Calendar */}
        <IonCard className="ion-padding">
          <IonCardContent>
            <IonGrid>
              {/* Weekday headers */}
              <IonRow>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <IonCol key={day} className="ion-text-center">
                    <IonText style={{ fontWeight: "bold" }}>{day}</IonText>
                  </IonCol>
                ))}
              </IonRow>

              {/* Calendar days */}
              {Array.from({ length: Math.ceil((daysInMonth + firstDay) / 7) }).map((_, rowIndex) => (
                <IonRow key={rowIndex}>
                  {Array.from({ length: 7 }).map((_, colIndex) => {
                    const dayNumber = rowIndex * 7 + colIndex - firstDay + 1;
                    if (dayNumber < 1 || dayNumber > daysInMonth) return <IonCol key={colIndex}></IonCol>;

                    const isToday = dayNumber === dayToday;
                    const isCompleted = completedDays.includes(dayNumber);

                    return (
                      <IonCol key={dayNumber} className="ion-text-center">
                        <div style={{ position: "relative", height: "30px" }}>
                          {isCompleted ? (
                            <IonIcon icon={checkmarkCircle} style={{ fontSize: "24px", color: "orange" }} />
                          ) : (
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                border: isToday ? "2px solid orange" : "2px solid lightgray",
                                margin: "0 auto",
                              }}
                            ></div>
                          )}
                        </div>
                        <IonText>
                          <p
                            style={{
                              margin: "4px 0 0 0",
                              fontSize: "12px",
                              fontWeight: isToday ? "bold" : "normal",
                              color: isToday ? "orange" : "inherit",
                            }}
                          >
                            {dayNumber}
                          </p>
                        </IonText>
                      </IonCol>
                    );
                  })}
                </IonRow>
              ))}
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Caption */}
        <IonText>
          
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Streak;
