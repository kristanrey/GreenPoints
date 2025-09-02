// src/pages/SetupUsername.tsx
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonToast,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSpinner,
  IonItem,
  IonLabel,
  IonIcon,
} from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router";
import { supabase } from "../utils/supabaseClient";
import { checkmarkCircle, closeCircle, person } from "ionicons/icons";

const SetupUsername: React.FC = () => {
  const [username, setUsername] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const history = useHistory();

  // Check if username is available
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("Error checking username:", error);
      setFeedback("❌ Error checking username availability");
      setShowToast(true);
      setIsAvailable(null);
    } else {
      setIsAvailable(!data); // If no data returned, username is available
    }
    
    setIsChecking(false);
  };

  const handleInputChange = (value: string) => {
    setUsername(value);
    // Check availability after a short delay to avoid excessive API calls
    setTimeout(() => checkUsernameAvailability(value), 500);
  };

  const handleSaveUsername = async () => {
    if (!username) {
      setFeedback("❌ Please enter a username");
      setShowToast(true);
      return;
    }

    if (username.length < 3) {
      setFeedback("❌ Username must be at least 3 characters");
      setShowToast(true);
      return;
    }

    // Check availability one more time before saving
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (data) {
      setFeedback("❌ This username is already taken");
      setShowToast(true);
      setShowModal(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFeedback("❌ No logged in user found.");
      setShowToast(true);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      username: username,
      role: "user",
    });

    if (error) {
      setFeedback("❌ Failed to save username: " + error.message);
      setShowToast(true);
      return;
    }

    // Success → redirect to dashboard
    setFeedback("✅ Username saved successfully!");
    setShowToast(true);
    setTimeout(() => history.replace("/userdashboard"), 1000);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="username-setup-container">
          <div className="ion-text-center">
            <IonIcon icon={person} size="large" className="setup-icon" />
            <h2>Choose your Username</h2>
            <IonText color="medium">
              <p>This will be your unique identifier in the app</p>
            </IonText>
          </div>

          <div className="input-container">
            <IonItem className="username-input" lines="full">
              <IonLabel position="stacked">Username</IonLabel>
              <IonInput
                placeholder="Enter a username"
                value={username}
                onIonInput={(e) => handleInputChange(e.detail.value!)}
                autocapitalize="off"
                autocomplete="off"
              />
            </IonItem>

            {username.length > 0 && (
              <div className="availability-check">
                {isChecking ? (
                  <div className="checking">
                    <IonSpinner name="crescent" />
                    <IonText color="medium">Checking availability...</IonText>
                  </div>
                ) : isAvailable === true ? (
                  <div className="available">
                    <IonIcon icon={checkmarkCircle} color="success" />
                    <IonText color="success">Username is available!</IonText>
                  </div>
                ) : isAvailable === false ? (
                  <div className="not-available">
                    <IonIcon icon={closeCircle} color="danger" />
                    <IonText color="danger">Username is already taken</IonText>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <IonButton 
            expand="block" 
            onClick={handleSaveUsername}
            disabled={!username || username.length < 3 || isAvailable === false}
          >
            Save & Continue
          </IonButton>

          <div className="username-rules">
            <IonText color="medium">
              <p>Username requirements:</p>
              <ul>
                <li>At least 3 characters long</li>
                <li>Must be unique</li>
                <li>Can contain letters, numbers, and underscores</li>
              </ul>
            </IonText>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message={feedback}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />

        {/* Username Taken Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Username Taken</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="modal-content">
              <IonIcon icon={closeCircle} color="danger" size="large" />
              <h2>Username Not Available</h2>
              <p>The username <strong>"{username}"</strong> is already taken. Please choose a different one.</p>
              
              <div className="suggestions">
                <h3>Suggestions:</h3>
                <ul>
                  <li>Try adding numbers (e.g., {username}123)</li>
                  <li>Try adding underscores (e.g., {username}_user)</li>
                  <li>Try a variation of your name</li>
                </ul>
              </div>
              
              <IonButton expand="block" onClick={() => setShowModal(false)}>
                Try Another Username
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default SetupUsername;