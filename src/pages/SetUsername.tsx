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
import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  // ✅ Auto-skip if user already has a username
  useEffect(() => {
    const checkExistingUsername = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setLoading(false);
        return;
      }

      const { user } = authData;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setLoading(false);
        return;
      }

      if (profile && profile.username) {
        // ✅ Redirect immediately if username exists
        history.replace("/userdashboard");
      } else {
        setLoading(false);
      }
    };

    checkExistingUsername();
  }, [history]);

  // ✅ Check if username is available
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
      setIsAvailable(!data);
    }

    setIsChecking(false);
  };

  // Debounce input check
  let debounceTimer: NodeJS.Timeout;
  const handleInputChange = (value: string) => {
    setUsername(value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => checkUsernameAvailability(value), 500);
  };

  // ✅ Save username
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

    // Double check availability
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      setFeedback("❌ This username is already taken");
      setShowToast(true);
      setShowModal(true);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setFeedback("❌ No logged in user found.");
      setShowToast(true);
      return;
    }

    const { user } = authData;

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        email: user.email,
        username: username.toLowerCase(),
        role: "user",
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      setFeedback("❌ Failed to save username: " + upsertError.message);
      setShowToast(true);
      return;
    }

    // ✅ Redirect instantly after saving
    history.replace("/userdashboard");
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading...</p>
        </IonContent>
      </IonPage>
    );
  }

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
              <p>
                The username <strong>"{username}"</strong> is already taken.
                Please choose a different one.
              </p>
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
