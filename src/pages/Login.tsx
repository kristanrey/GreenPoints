// src/pages/Login.tsx
import "./login.css";
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonInput,
  IonPage,
  IonText,
  IonAlert,
  IonItem,
  IonIcon,
} from "@ionic/react";
import { mailOutline, lockClosedOutline } from "ionicons/icons";
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useIonRouter, useIonToast } from "@ionic/react";

// ✅ Redirect URL depending on environment (localhost vs GitHub Pages)
const getRedirectUrl = () => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    // Local development
    if (origin.includes("localhost")) {
      return "http://localhost:8100/GreenPoints/oauth-callback";
    }

    // GitHub Pages deployment
    if (origin.includes("github.io")) {
      return "https://kristanrey.github.io/GreenPoints/oauth-callback";
    }
  }

  // Default fallback (local dev)
  return "http://localhost:8100/GreenPoints/oauth-callback";
};

const redirectUrl = getRedirectUrl();

const Login: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Email/Password Login
  const doLogin = async () => {
    if (!email || !password) {
      setAlertMessage("Please fill in both fields.");
      setShowAlert(true);
      return;
    }

    localStorage.removeItem("currentUser");

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setAlertMessage(
          "Please confirm your email before logging in. Check your inbox."
        );
      } else if (
        authError.message.toLowerCase().includes("invalid login credentials")
      ) {
        setAlertMessage("Invalid email or password.");
      } else {
        setAlertMessage(authError.message);
      }
      setShowAlert(true);
      return;
    }

    // ✅ Fetch user profile
    let profileData = null;
    const { data: fetchedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authData.user.id)
      .single();

    if (fetchedProfile) profileData = fetchedProfile;

    // ✅ Save session locally
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

    router.push("/GreenPoints/userdashboard");
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem("currentUser");
      await supabase.auth.signOut().catch(() => {});

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setAlertMessage(
        "Google Sign-In failed: " + (err?.message || "Unknown error")
      );
      setShowAlert(true);
    }
  };

  // Facebook OAuth Login
  const loginWithFacebook = async () => {
    try {
      localStorage.removeItem("currentUser");
      await supabase.auth.signOut().catch(() => {});

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setAlertMessage(
        "Facebook Sign-In failed: " + (err?.message || "Unknown error")
      );
      setShowAlert(true);
    }
  };

  const goToRegister = () => {
    router.push("/GreenPoints/register");
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-background">
          <div className="login-container">
            {/* Logo */}
            <IonAvatar className="login-logo">
              <img
                src="https://marketplace.canva.com/ARZ8E/MAFmAUARZ8E/1/tl/canva-natural-leaf-icon.-100%25-naturals-vector-image-MAFmAUARZ8E.png"
                alt="Avatar"
              />
            </IonAvatar>

            {/* Email */}
            <IonItem className="custom-input" lines="none">
              <IonIcon icon={mailOutline} slot="start" />
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                placeholder="Enter email"
              />
            </IonItem>

            {/* Password */}
            <IonItem className="custom-input" lines="none">
              <IonIcon icon={lockClosedOutline} slot="start" />
              <IonInput
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value!)}
                placeholder="Enter password"
              />
            </IonItem>

            <IonButton onClick={doLogin} expand="block" className="login-button">
              Login
            </IonButton>

            <IonText className="login-or">or</IonText>

            {/* OAuth buttons */}
            <div className="oauth-buttons">
              <div
                onClick={loginWithGoogle}
                className="oauth-icon"
                role="button"
                aria-label="Login with Google"
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google Login"
                />
              </div>

              <div
                onClick={loginWithFacebook}
                className="oauth-icon"
                role="button"
                aria-label="Login with Facebook"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
                  alt="Facebook Login"
                  className="facebook-icon"
                />
              </div>
            </div>

            <IonText className="register-text">
              Don&apos;t have an account?{" "}
              <span onClick={goToRegister} className="register-link">
                Sign up
              </span>
            </IonText>

            {/* Alerts */}
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