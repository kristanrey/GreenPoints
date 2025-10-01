// src/pages/Register.tsx
import {
  IonAvatar,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonInput,
  IonModal,
  IonPage,
  IonRow,
  IonText,
  IonAlert,
  IonSelect,
  IonSelectOption,
  useIonRouter,
  useIonToast,
  IonIcon,
} from "@ionic/react";
import { useState } from "react";
import { mailOutline, personOutline, lockClosedOutline } from "ionicons/icons";
import "./css/Register.css";
import { supabase } from "../utils/supabaseClient";

const Register: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");

  const handleRegister = () => {
    if (!username || !email || !password || !confirmPassword || !role) {
      setAlertMessage("All fields are required!");
      setShowAlert(true);
      return;
    }
    if (password !== confirmPassword) {
      setAlertMessage("Passwords do not match!");
      setShowAlert(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmRegistration = async () => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("User not created in auth.");

      const { error: insertError } = await supabase.from("profiles").insert([
        {
          user_id: authData.user.id,
          username,
          email,
          role,
          trees_planted: 0,
          greenpoints: 0,
        },
      ]);
      if (insertError) throw insertError;

      // Insert register log
      const { error: logError } = await supabase.from("logs").insert([
        {
          user_id: authData.user.id,
          email: email,
          action: "register",
          logout_time: null,
        },
      ]);
      if (logError) throw logError;

      setShowConfirmModal(false);

      presentToast({
        message: `Registered as ${role.toUpperCase()}!`,
        duration: 2000,
        position: "top",
        color: "success",
      });

      router.push("/GreenPoints/userdashboard");
    } catch (err: any) {
      setAlertMessage(err.message);
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="register-background">
          <div className="register-container">
            <IonGrid>
              <IonRow>
                <IonCol className="ion-text-center">
                  <IonAvatar
                    style={{ width: "100px", height: "100px", margin: "auto" }}
                  >
                    <img
                      src="https://marketplace.canva.com/ARZ8E/MAFmAUARZ8E/1/tl/canva-natural-leaf-icon.-100%25-naturals-vector-image-MAFmAUARZ8E.png"
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </IonAvatar>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonInput
              className="custom-input"
              type="email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
              placeholder="Email"
            >
              <IonIcon icon={mailOutline} slot="start" />
            </IonInput>

            <IonInput
              className="custom-input"
              value={username}
              onIonChange={(e) => setUsername(e.detail.value!)}
              placeholder="Username"
            >
              <IonIcon icon={personOutline} slot="start" />
            </IonInput>

            <IonInput
              className="custom-input"
              type="password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
              placeholder="Password"
            >
              <IonIcon icon={lockClosedOutline} slot="start" />
            </IonInput>

            <IonInput
              className="custom-input"
              type="password"
              value={confirmPassword}
              onIonChange={(e) => setConfirmPassword(e.detail.value!)}
              placeholder="Confirm Password"
            >
              <IonIcon icon={lockClosedOutline} slot="start" />
            </IonInput>

            <IonText style={{ display: "block", marginTop: "10px" }}>
              Select Your Role
            </IonText>
            <IonSelect
              value={role}
              placeholder="Select Role"
              onIonChange={(e) => setRole(e.detail.value)}
            >
              <IonSelectOption value="user">🌱 User (Tree Grower)</IonSelectOption>
            </IonSelect>

            <IonButton
              onClick={handleRegister}
              expand="block"
              style={{ marginTop: "20px" }}
            >
              Register
            </IonButton>
          </div>

          <IonAlert
            isOpen={showAlert}
            message={alertMessage}
            buttons={["OK"]}
            onDidDismiss={() => setShowAlert(false)}
          />

          <IonModal isOpen={showConfirmModal}>
            <IonContent className="ion-padding">
              <IonText>
                Confirm registration for <strong>{username}</strong> as{" "}
                <strong>{role}</strong>?
              </IonText>
              <IonButton
                expand="full"
                color="success"
                onClick={confirmRegistration}
              >
                Confirm & Register
              </IonButton>
              <IonButton
                expand="full"
                color="danger"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </IonButton>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
