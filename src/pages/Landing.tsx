// src/pages/Landing.tsx
import {
  IonPage,
  IonContent,
  IonButton,
  IonText
} from "@ionic/react";
import "./Landing.css";
import { useHistory } from "react-router-dom";

const Landing: React.FC = () => {
  const history = useHistory();

  const handleStart = () => {
    // 🎵 Create and play audio after user interaction
    const audio = new Audio("public/music/Lil Dicky - Earth (Official Music Video).mp3");
    audio.loop = true;
    audio.play().catch((err) => {
      console.log("Autoplay blocked or error:", err);
    });

    // Navigate to login page
    history.push("/GreenPoints/login");
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="landing-background">
          <div className="landing-container">
            <img
              src="https://marketplace.canva.com/ARZ8E/MAFmAUARZ8E/1/tl/canva-natural-leaf-icon.-100%25-naurals-vector-image-MAFmAUARZ8E.png"
              alt="Logo"
              className="logo"
            />
            <h1 className="title">GreenPoints</h1>
            <IonText className="subtitle">
              Grow Trees. Earn Rewards. Make a Difference.
            </IonText>

            <img
              src="https://scontent.fcgy4-1.fna.fbcdn.net/v/t1.15752-9/522341098_1094714478913591_4251909951679950225_n.png"
              alt="Tree Icon"
              className="tree-icon"
              style={{ width: "250px", height: "250px" }}
            />

            <IonButton
              expand="block"
              color="success"
              className="start-button"
              onClick={handleStart}
            >
              Get Started
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="learn-button"
              onClick={() => alert("More info coming soon!")}
            >
              Learn More
            </IonButton>

            <IonText className="footer">
              © 2025 GreenPoints | NBSC BSIT Team
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Landing;
