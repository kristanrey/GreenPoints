// src/pages/SetupUsername.tsx
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonToast,
} from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router";
import { supabase } from "../utils/supabaseClient";

const SetupUsername: React.FC = () => {
  const [username, setUsername] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);
  const history = useHistory();

  const handleSaveUsername = async () => {
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
    history.replace("/userdashboard");
  };

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <h2>Choose your Username</h2>
        <IonInput
          placeholder="Enter a username"
          value={username}
          onIonChange={(e) => setUsername(e.detail.value!)}
        />
        <IonButton expand="block" onClick={handleSaveUsername}>
          Save & Continue
        </IonButton>

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

export default SetupUsername;
