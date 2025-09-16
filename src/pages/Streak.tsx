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

  // Update "today" in real time (every minute)
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

  // Fetch login logs for current month
  useEffect(() => {
    const fetchLogs = async () => {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from("logs")
        .select("created_at, action")
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth)
        .eq("action", "login");

      if (error) {
        console.error("Error fetching logs:", error);
        return;
      }

      // Extract unique days where login happened
      const days = Array.from(
        new Set(data.map((log) => new Date(log.created_at).getDate()))
      ).sort((a, b) => a - b);

      setCompletedDays(days);

      // Calculate points
      let totalPoints = 0;
      let streakBonus = 0;

      for (let i = 0; i < days.length; i++) {
        totalPoints += 0.5; // base points
        if (i > 0 && days[i] === days[i - 1] + 1) {
          streakBonus += 0.1; // consecutive login bonus
        }
      }

      setPoints(parseFloat((totalPoints + streakBonus).toFixed(1)));
    };

    fetchLogs();
  }, [year, month]);

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        {/* Header with flame and points */}
        <div style={{ fontSize: "80px", color: "orange", display: "flex", justifyContent: "center", alignItems: "center" }}>
          🔥
          <IonText color="warning" style={{ marginLeft: "10px", fontSize: "24px", fontWeight: "bold" }}>
            {points} pts
          </IonText>
        </div>

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
              {Array.from({
                length: Math.ceil((daysInMonth + firstDay) / 7),
              }).map((_, rowIndex) => (
                <IonRow key={rowIndex}>
                  {Array.from({ length: 7 }).map((_, colIndex) => {
                    const dayNumber =
                      rowIndex * 7 + colIndex - firstDay + 1;

                    if (dayNumber < 1 || dayNumber > daysInMonth) {
                      return <IonCol key={colIndex}></IonCol>; // empty cell
                    }

                    const isToday = dayNumber === dayToday;
                    const isCompleted = completedDays.includes(dayNumber);

                    return (
                      <IonCol key={dayNumber} className="ion-text-center">
                        <div style={{ position: "relative", height: "30px" }}>
                          {isCompleted ? (
                            <IonIcon
                              icon={checkmarkCircle}
                              style={{ fontSize: "24px", color: "orange" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                border: isToday
                                  ? "2px solid orange"
                                  : "2px solid lightgray",
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
          <p>
            ✅ Check = logged in that day.  
            🔲 Orange border = today.  
            🔥 Points = +0.5 daily, +0.1 per streak.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Streak;
