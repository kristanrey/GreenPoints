import {
  IonPage,
  IonContent,
  IonText,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonToast,
  IonModal,
} from "@ionic/react";
import { home, leaf, gift, person, camera } from "ionicons/icons";
import { useEffect, useState } from "react";
import "./UserDashboard.css";

const UserDashboard: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [treesPlanted, setTreesPlanted] = useState(0);
  const [greenpoints, setGreenpoints] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setUserName(currentUser.username || currentUser.name || "Guest");
    setTreesPlanted(currentUser.treesPlanted || 0);
    setGreenpoints(currentUser.greenpoints || 0);
  }, []);

  const updateLocalStorage = (newTreeCount: number, newPoints: number) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    currentUser.treesPlanted = newTreeCount;
    currentUser.greenpoints = newPoints;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  };

  const handleMonitorStatus = () => {
    setFeedback("Status: Your tree submissions are being validated.");
    setShowToast(true);
  };

  const handleOpenCamera = () => {
    setShowCameraModal(true); // Simulates opening camera
  };

  const handleSimulatePhotoTaken = () => {
    const count = treesPlanted + 1;
    const points = greenpoints + 25;

    setTreesPlanted(count);
    setGreenpoints(points);
    updateLocalStorage(count, points);
    setShowCameraModal(false);
    setFeedback("📸 Tree photo submitted! Awaiting validation.");
    setShowToast(true);
  };

  const handleViewRewards = () => {
    setFeedback(`🎁 You have ${greenpoints} GreenPoints to redeem!`);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="dashboard-content">
        <div className="welcome-text">Welcome back, {userName}</div>

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

        <IonButton expand="block" className="dashboard-button" onClick={handleMonitorStatus}>
          Monitor Status
        </IonButton>
        <IonButton expand="block" className="dashboard-button" color="success" onClick={handleOpenCamera}>
          <IonIcon icon={camera} slot="start" />
          Submit New Tree
        </IonButton>
        <IonButton expand="block" className="dashboard-button" onClick={handleViewRewards}>
          View Rewards
        </IonButton>

        {feedback && <IonText className="feedback-text">{feedback}</IonText>}

        <div className="bottom-nav">
          <IonIcon icon={home} className="nav-icon" />
          <IonIcon icon={leaf} className="nav-icon" />
          <IonIcon icon={gift} className="nav-icon" />
          <IonIcon icon={person} className="nav-icon" />
        </div>

        {/* Camera Modal */}
        <IonModal isOpen={showCameraModal} onDidDismiss={() => setShowCameraModal(false)}>
          <IonContent className="ion-padding">
            <h2 style={{ textAlign: "center" }}>Simulate Taking a Photo</h2>
            <img
              src="https://cdn-icons-png.flaticon.com/512/3771/3771421.png"
              alt="Camera Simulation"
              style={{ width: "100px", margin: "auto", display: "block" }}
            />
            <IonButton expand="full" color="success" onClick={handleSimulatePhotoTaken}>
              Take Photo & Submit
            </IonButton>
            <IonButton expand="full" color="medium" onClick={() => setShowCameraModal(false)}>
              Cancel
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          message={feedback}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default UserDashboard;
