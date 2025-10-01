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
import { useHistory } from "react-router-dom";
import { eye, eyeOff } from "ionicons/icons";
import './css/ValidatorsLogin.css';

const ValidatorsAuth: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (isRegister) {
      // Step 1: Register in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setToastMessage(error.message);
        setShowToast(true);
        return;
      }

      // Step 2: Insert into validators table
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
            "Auth created but failed to insert validator: " +
              insertError.message
          );
        } else {
          setToastMessage("Registration successful! Please log in.");
          setIsRegister(false);
        }
        setShowToast(true);
      }
    } else {
      // Step 1: Login with Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setToastMessage(error.message);
        setShowToast(true);
        return;
      }

      // Step 2: Verify user exists in validators table
      const user = data.user;
      if (user) {
        const { data: validator, error: validatorError } = await supabase
          .from("validators")
          .select("validator_id")
          .eq("validator_id", user.id)
          .single();

        if (validatorError || !validator) {
          await supabase.auth.signOut(); // ❌ force logout
          setToastMessage("Access denied: not a registered validator.");
          setShowToast(true);
          return;
        }
      }

      // ✅ Validator confirmed
      history.push("/Greenpoints/validators");
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

          <IonButton
            expand="block"
            fill="clear"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don’t have an account? Register"}
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
