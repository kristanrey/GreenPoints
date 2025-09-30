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
                src="https://scontent.fcgy4-1.fna.fbcdn.net/v/t1.15752-9/522341098_1094714478913591_4251909951679950225_n.png?_nc_cat=105&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeGWIpOxQ_W3lYt9sxtKQdADrb9lzD4spMmtv2XMPiykyU2qRncsDps76OTLE1sDLg4T6KkFROMU_Z2nGj1xCFA3&_nc_ohc=fWPFbGF1V7QQ7kNvwFqHAQa&_nc_oc=AdnMGO0ThicGoG4CsKxFN-Wfe8n99BmgdqdW9GUB2A5tlRMlu0Mw4bfwUuRTqJ0bRHAIIn11k3HGAKmXe-Wgl7YI&_nc_ad=z-m&_nc_cid=5917&_nc_zt=23&_nc_ht=scontent.fcgy4-1.fna&oh=03_Q7cD3QG3oo91ZFj338i-YG5i-Q22dYjqhwFSVBSQhKpG0GINWw&oe=68DE6737"
                alt="Tree Icon"
                className="tree-icon"
                style={{ width: "250px", height: "250px" }} // 👈 test override
  />
              

              <IonButton
                expand="block"
                color="success"
                className="start-button"
                onClick={() => history.push("/GreenPoints/login")}
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