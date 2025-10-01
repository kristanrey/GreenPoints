import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonButton,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import "./css/Rewards.css";

interface Reward {
  id: number;
  name: string;
  description: string | null;
  points: number;
  image_url?: string | null;
}

const RewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("rewards")
        .select("id, name, description, points, image_url")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rewards:", error.message);
      } else if (data) {
        setRewards(data);
      }
      setLoading(false);
    };

    fetchRewards();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="ion-text-center">🌿 Rewards</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding rewards-background">
        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner name="crescent" />
          </div>
        ) : rewards.length === 0 ? (
          <p className="ion-text-center">No rewards available yet.</p>
        ) : (
          <IonGrid>
            <IonRow>
              {rewards.map((reward) => (
                <IonCol size="12" sizeMd="6" sizeLg="4" key={reward.id}>
                  <div className="reward-card">
                    <div className="reward-points">+{reward.points}</div>
                    <div className="reward-icon">
                      {reward.image_url ? (
                        <img src={reward.image_url} alt={reward.name} />
                      ) : (
                        <span className="placeholder-icon">🎁</span>
                      )}
                    </div>
                    <div className="reward-body">
                      <h3>{reward.name}</h3>
                      <p>{reward.description || "No description available."}</p>
                      <IonButton
                        expand="block"
                        color="success"
                        className="reward-button"
                      >
                        Claim for {reward.points} pts
                      </IonButton>
                    </div>
                  </div>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RewardsPage;
