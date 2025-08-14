// src/pages/Leaderboard.tsx
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from "@ionic/react";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient"; // make sure path is correct

interface LeaderboardEntry {
  id: string;
  username: string;
  trees_planted: number;
  greenpoints: number;
  avatar_url?: string;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard from Supabase
  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles") // change table name if needed
      .select("id, username, trees_planted, greenpoints, avatar_url")
      .order("greenpoints", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
    } else {
      setLeaderboard(data || []);
    }
    setLoading(false);
  };

  // Subscribe to real-time leaderboard updates
  const subscribeToLeaderboard = () => {
    const channel = supabase
      .channel("leaderboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" }, // adjust table if needed
        () => {
          fetchLeaderboard(); // refresh when change happens
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchLeaderboard();
    const unsubscribe = subscribeToLeaderboard();
    return unsubscribe;
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <IonSpinner style={{ display: "block", margin: "20px auto" }} />
        ) : (
          <IonList>
            {leaderboard.map((entry, index) => (
              <IonItem key={entry.id}>
                <IonAvatar slot="start">
                  <img
                    src={
                      entry.avatar_url ||
                      `https://i.pravatar.cc/150?img=${index + 1}`
                    }
                    alt={entry.username}
                  />
                </IonAvatar>
                <IonLabel>
                  <h2>
                    {index + 1}. {entry.username}
                  </h2>
                  <p>
                    🌳 {entry.trees_planted} trees | 🟢 {entry.greenpoints} GP
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;
