// src/pages/Leaderboard.tsx
import React from "react";
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
  IonText,
  IonBadge,
} from "@ionic/react";

import "./Admin.css";

const Leaderboard: React.FC = () => {
  // Dummy data (you can replace with API or Supabase later)
  const leaderboardData = [
    { id: 1, name: "Alice", points: 1200, avatar: "/assets/avatar1.png" },
    { id: 2, name: "Bob", points: 1100, avatar: "/assets/avatar2.png" },
    { id: 3, name: "Charlie", points: 950, avatar: "/assets/avatar3.png" },
    { id: 4, name: "Diana", points: 870, avatar: "/assets/avatar4.png" },
    { id: 5, name: "Ethan", points: 800, avatar: "/assets/avatar5.png" },
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Leaderboards</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="leaderboard-page">
        <IonList>
          {leaderboardData.map((user, index) => (
            <IonItem key={user.id} className={`rank-${index + 1}`}>
              <IonBadge slot="start" color={index === 0 ? "warning" : index === 1 ? "medium" : index === 2 ? "tertiary" : "light"}>
                #{index + 1}
              </IonBadge>
              <IonAvatar slot="start">
                <img src={user.avatar} alt={user.name} />
              </IonAvatar>
              <IonLabel>
                <h2>{user.name}</h2>
                <IonText color="medium">{user.points} pts</IonText>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;
