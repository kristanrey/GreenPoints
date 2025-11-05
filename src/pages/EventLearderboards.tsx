// src/pages/EventLeaderboard.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonLabel,
  IonAvatar,
  IonText,
  IonBadge,
  IonCard,
  IonCardContent,
  IonSpinner,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface LeaderboardEntry {
  response_id: number;
  event_id: number;
  user_id: string;
  username: string;
  photo: string;
  points: number;
  created_at: string;
  status: string;
}

const EventLeaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // ✅ Remove generic arguments, cast data instead
        const { data, error } = await supabase
          .from("event_responses")
          .select("*")
          .eq("status", "approved");

        if (error) {
          console.error("Supabase fetch error:", error);
          return;
        }

        if (data) {
          // Cast to LeaderboardEntry[]
          const sorted = (data as LeaderboardEntry[]).sort((a, b) => b.points - a.points);
          setEntries(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#FFD700"; // gold
      case 2:
        return "#C0C0C0"; // silver
      case 3:
        return "#CD7F32"; // bronze
      default:
        return "#E0E0E0"; // light gray
    }
  };

  const getCardStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { background: "linear-gradient(135deg, #FFD700, #FFC107)", color: "#000" };
      case 2:
        return { background: "linear-gradient(135deg, #C0C0C0, #B0B0B0)", color: "#000" };
      case 3:
        return { background: "linear-gradient(135deg, #CD7F32, #D2A679)", color: "#000" };
      default:
        return { background: "#F8F8F8", color: "#333" };
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Event Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "50%" }}>
            <IonSpinner name="crescent" />
          </div>
        ) : entries.length === 0 ? (
          <IonText color="medium">No leaderboard data available.</IonText>
        ) : (
          <IonList>
            {entries.map((entry, index) => (
              <IonCard
                key={entry.response_id}
                style={{
                  marginBottom: "12px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  ...getCardStyle(index + 1),
                }}
              >
                <IonCardContent
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "12px 16px",
                  }}
                >
                  <IonBadge
                    style={{
                      backgroundColor: getRankBadgeColor(index + 1),
                      color: index <= 2 ? "#000" : "#333",
                      fontWeight: "bold",
                      fontSize: "16px",
                      minWidth: "32px",
                      height: "32px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "50%",
                    }}
                  >
                    {index + 1}
                  </IonBadge>

                  <IonAvatar
                    style={{
                      width: index === 0 ? "60px" : "48px",
                      height: index === 0 ? "60px" : "48px",
                      border: index <= 2 ? "2px solid #fff" : "none",
                    }}
                  >
                    <img
                      src={entry.photo || "/assets/default-avatar.png"}
                      alt={entry.username}
                      style={{ objectFit: "cover" }}
                    />
                  </IonAvatar>

                  <IonLabel style={{ flex: 1 }}>
                    <IonText style={{ fontWeight: "bold", fontSize: index === 0 ? "18px" : "16px" }}>
                      {entry.username}
                    </IonText>
                    <p style={{ margin: 0, color: index <= 2 ? "#fff" : "#555" }}>{entry.points} points</p>
                  </IonLabel>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default EventLeaderboard;
