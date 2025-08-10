// src/pages/Login.tsx
import './login.css';
import {
  IonAvatar,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  IonText,
  IonAlert,
  IonItem,
  IonIcon,
  useIonRouter,
  useIonToast,
} from "@ionic/react";
import { mailOutline, lockClosedOutline } from 'ionicons/icons';
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

const Login: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const doLogin = async () => {
    if (!email || !password) {
      setAlertMessage("Please fill in both fields.");
      setShowAlert(true);
      return;
    }

    // Attempt login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setAlertMessage("Please confirm your email before logging in. Check your inbox.");
      } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
        setAlertMessage("Invalid email or password.");
      } else {
        setAlertMessage(authError.message);
      }
      setShowAlert(true);
      return;
    }

    // Fetch profile data if exists
    let profileData = null;
    const { data: fetchedProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (!profileError) {
      profileData = fetchedProfile;
    }

    // Store in localStorage
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: authData.user.id,
        name: profileData?.username || email,
        email: authData.user.email,
        role: profileData?.role || "User",
        treesPlanted: profileData?.trees_planted || 0,
        greenpoints: profileData?.greenpoints || 0,
      })
    );

    presentToast({
      message: "Login Success!",
      duration: 2000,
      position: "top",
      color: "success",
    });

    router.push("/GreenPoints/user-dashboard");
  };

  const goToRegister = () => {
    router.push("/GreenPoints/register");
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAlertMessage("Google login is not yet linked with Supabase.");
      setShowAlert(true);
    },
    onError: () => {
      setAlertMessage("Google Sign-In failed. Please try again.");
      setShowAlert(true);
    },
  });

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-background">
          <div className="login-container">
            <IonAvatar className="login-logo">
              <img
                src="https://marketplace.canva.com/ARZ8E/MAFmAUARZ8E/1/tl/canva-natural-leaf-icon.-100%25-naturals-vector-image-MAFmAUARZ8E.png"
                alt="Avatar"
              />
            </IonAvatar>

            <IonItem className="custom-input" lines="none">
              <IonIcon icon={mailOutline} slot="start" />
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                placeholder="Enter email"
              />
            </IonItem>
    
            <IonItem className="custom-input" lines="none">
              <IonIcon icon={lockClosedOutline} slot="start" />
              <IonInput
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value!)}
                placeholder="Enter password"
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>
            </IonItem>

            <IonButton onClick={doLogin} expand="block" className="login-button">
              Login
            </IonButton>

            <IonText className="login-or">or</IonText>

            <div className="oauth-buttons">
              <div onClick={() => loginWithGoogle()} className="oauth-icon">
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google Login"
                />
              </div>

              <FacebookLogin
                appId="741074022014246"
                autoLoad={false}
                useRedirect={false}
                onSuccess={() => {
                  setAlertMessage("Facebook login is not yet linked with Supabase.");
                  setShowAlert(true);
                }}
                onFail={(err) => {
                  console.error("Facebook Login Error:", err);
                  setAlertMessage("Facebook login failed.");
                  setShowAlert(true);
                }}
                scope="public_profile,email"
                fields="name,email"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
                  alt="Facebook Login"
                  className="facebook-icon"
                />
              </FacebookLogin>
            </div>

            <IonText className="register-text">
              Don't have an account?{" "}
              <span onClick={goToRegister} className="register-link">
                Sign up
              </span>
            </IonText>

            <IonAlert
              isOpen={showAlert}
              message={alertMessage}
              buttons={["OK"]}
              onDidDismiss={() => setShowAlert(false)}
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
