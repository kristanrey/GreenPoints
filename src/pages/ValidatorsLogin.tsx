import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonToast,
  IonText,
  IonIcon,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { eye, eyeOff } from "ionicons/icons";
import './css/ValidatorsLogin.css';

const ValidatorsAuth: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (isRegister) {
      // Register new validator
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setToastMessage(error.message);
        setShowToast(true);
        return;
      }

      if (data.user) {
        const { error: insertError } = await supabase.from("validators").upsert([
          {
            validator_id: data.user.id,
            full_name: fullName,
            email,
          },
        ]);

        if (insertError) {
          setToastMessage(
            "Auth created but failed to insert validator: " + insertError.message
          );
        } else {
          setToastMessage("Registration successful! Please log in.");
          setIsRegister(false);
        }
        setShowToast(true);
      }
    } else {
      // Login validator
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setToastMessage(error.message);
        setShowToast(true);
        return;
      }

      const user = data.user;
      if (user) {
        const { data: validator, error: validatorError } = await supabase
          .from("validators")
          .select("validator_id")
          .eq("validator_id", user.id)
          .single();

        if (validatorError || !validator) {
          await supabase.auth.signOut();
          setToastMessage("Access denied: not a registered validator.");
          setShowToast(true);
          return;
        }
      }

      // Redirect to EventDashboard using href
      window.location.href = "/GreenPoints/eventdashboard";
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="auth-container">
        <div className="auth-box">
          <IonText color="primary">
            <h2>{isRegister ? "Validator Register" : "Validator Login"}</h2>
          </IonText>

          {isRegister && (
            <IonItem>
              <IonLabel position="floating">Full Name</IonLabel>
              <IonInput
                value={fullName}
                onIonChange={(e) => setFullName(e.detail.value!)}
              />
            </IonItem>
          )}

          <IonItem>
            <IonLabel position="floating">Email</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="floating">Password</IonLabel>
            <IonInput
              type={showPassword ? "text" : "password"}
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            />
            <IonIcon
              slot="end"
              icon={showPassword ? eyeOff : eye}
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            />
          </IonItem>

          <IonButton expand="block" onClick={handleSubmit} className="auth-btn">
            {isRegister ? "Register" : "Login"}
          </IonButton>

       
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2500}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ValidatorsAuth;
