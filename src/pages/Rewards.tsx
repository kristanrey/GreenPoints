// src/pages/RewardsPage.tsx
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";

interface Reward {
  id: number;
  name: string;
  description: string;
  pointsRequired: number;
}

const RewardsPage: React.FC = () => {
  // Example reward data, replace with database fetch if needed
  const rewards: Reward[] = [
    { id: 1, name: "Reusable Water Bottle", description: "Eco-friendly stainless steel bottle.", pointsRequired: 50 },
    { id: 2, name: "Tree Planting Kit", description: "Everything you need to plant a tree at home.", pointsRequired: 100 },
    { id: 3, name: "Eco Tote Bag", description: "Carry your items in style while saving the planet.", pointsRequired: 30 },
    { id: 4, name: "Discount Voucher", description: "Get a 10% discount on eco-friendly products.", pointsRequired: 70 },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Rewards</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            {rewards.map((reward) => (
              <IonCol size="12" sizeMd="6" key={reward.id}>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>{reward.name}</IonCardTitle>
                    <IonBadge color="success">{reward.pointsRequired} Points</IonBadge>
                  </IonCardHeader>
                  <IonCardContent>{reward.description}</IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default RewardsPage;
