// src/pages/Leaderboard.tsx
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonText,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { trophy, medal } from "ionicons/icons";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import "./Leaderboard.css";

interface Player {
  rank: number;
  username: string;
  greenpoints: number;
  avatar_url?: string | null;
}

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      // ✅ Fetch profiles with avatar
      const { data, error } = await supabase
        .from("profiles")
        .select("username, greenpoints, avatar_url")
        .order("greenpoints", { ascending: false });

      if (error) {
        console.error("Error fetching leaderboard:", error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const ranked = data.map((player, index) => ({
          rank: index + 1,
          username: player.username || "Anonymous",
          greenpoints: player.greenpoints || 0,
          avatar_url: player.avatar_url || null,
        }));
        setPlayers(ranked);
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <IonPage>
      <IonContent className="leaderboard-bg" fullscreen>
        <div className="leaderboard-container">
          <IonCard className="leaderboard-card">
            <IonCardHeader>
              <IonCardTitle className="leaderboard-title">LEADERBOARD</IonCardTitle>
            </IonCardHeader>

            {loading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <IonSpinner name="crescent" />
              </div>
            ) : (
              <IonList>
                {players.map((player, index) => (
                  <IonItem key={index} className="leaderboard-item">
                    {/* Rank section */}
                    <IonLabel>
                      <div className="rank-section">
                        {player.rank === 1 && (
                          <IonIcon icon={trophy} color="warning" className="rank-icon" />
                        )}
                        {player.rank === 2 && (
                          <IonIcon icon={medal} color="medium" className="rank-icon" />
                        )}
                        {player.rank === 3 && (
                          <IonIcon icon={medal} color="tertiary" className="rank-icon" />
                        )}
                        {player.rank > 3 && (
                          <IonText className="rank-text">{player.rank}</IonText>
                        )}
                      </div>
                    </IonLabel>

                    {/* ✅ Avatar from DB */}
                    <IonAvatar slot="start">
                      <img
                        src={
                          player.avatar_url ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt="avatar"
                      />
                    </IonAvatar>

                    {/* Username */}
                    <IonLabel className="name-label">{player.username}</IonLabel>

                    {/* Score */}
                    <IonText slot="end" className="score-text">
                      {player.greenpoints}
                    </IonText>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;
