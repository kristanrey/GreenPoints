// src/pages/UserDashboard.tsx
import {
  IonPage,
  IonContent,
  IonText,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { home, leaf, gift, person } from "ionicons/icons";
import "./UserDashboard.css";

const UserDashboard: React.FC = () => {
  const userName = "Tanly"; // Replace this later with dynamic user data
  const treesPlanted = 10;   // Replace with dynamic data
  const greenpoints = 250;   // Replace with dynamic data

  return (
    <IonPage>
      <IonContent fullscreen className="dashboard-content">
        <div className="welcome-text">
          Welcome back, {userName}
        </div>

        <IonCard className="stats-card">
          <IonCardContent>
            <div className="stat-item">
              <img
                src="https://cdn-icons-png.flaticon.com/512/427/427735.png"
                alt="Tree Icon"
                className="tree-icon"
              />
              <IonText className="stat-label">Trees Planted</IonText>
              <IonText className="stat-value">{treesPlanted}</IonText>
            </div>
            <hr className="divider" />
            <div className="stat-item">
              <IonText className="stat-label">Greenpoints Earned</IonText>
              <IonText className="stat-value">{greenpoints}</IonText>
            </div>
          </IonCardContent>
        </IonCard>

        <IonButton expand="block" className="dashboard-button">Monitor Status</IonButton>
        <IonButton expand="block" className="dashboard-button">Submit New Tree</IonButton>
        <IonButton expand="block" className="dashboard-button">View Rewards</IonButton>

        <div className="bottom-nav">
          <IonIcon icon={home} className="nav-icon" />
          <IonIcon icon={leaf} className="nav-icon" />
          <IonIcon icon={gift} className="nav-icon" />
          <IonIcon icon={person} className="nav-icon" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UserDashboard;
