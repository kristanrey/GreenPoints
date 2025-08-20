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
  IonModal,
} from "@ionic/react";
import { mailOutline, lockClosedOutline, personCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import FacebookLogin from "@greatsumini/react-facebook-login";
import { useIonRouter, useIonToast } from "@ionic/react";

const Login: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // For username modal after Google login
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [pendingUser, setPendingUser] = useState<any>(null);

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
        setAlertMessage("Please confirm your email before logging in. Check your inbox.");
      } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
        setAlertMessage("Invalid email or password.");
      } else {
        setAlertMessage(authError.message);
      }
      setShowAlert(true);
      return;
    }

    let profileData = null;
    const { data: fetchedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (fetchedProfile) profileData = fetchedProfile;

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

  // Google OAuth Login
  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem("currentUser");
      await supabase.auth.signOut().catch(() => {});

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/GreenPoints/oauth-callback",
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) throw error;

      // After redirect, Supabase session is set automatically
      setTimeout(checkGoogleUser, 2000);
    } catch (err: any) {
      setAlertMessage("Google Sign-In failed: " + (err?.message || "Unknown error"));
      setShowAlert(true);
    }
  };

  const checkGoogleUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return;

    // Always force username modal for Google users
    setPendingUser(user);
    setShowUsernameModal(true);
  };

  const saveNewUsername = async () => {
    if (!newUsername.trim() || !pendingUser) return;

    // Overwrite or insert username in profiles
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: pendingUser.id,
        email: pendingUser.email,
        username: newUsername.trim(),
      });

    if (error) {
      setAlertMessage("Failed to save username: " + error.message);
      setShowAlert(true);
      return;
    }

    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: pendingUser.id,
        name: newUsername.trim(),
        email: pendingUser.email,
        role: "User",
        treesPlanted: 0,
        greenpoints: 0,
      })
    );

    setShowUsernameModal(false);
    setNewUsername("");
    setPendingUser(null);

    router.push("/GreenPoints/user-dashboard");
  };

  // Go to Register page
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
              <div onClick={loginWithGoogle} className="oauth-icon" role="button" aria-label="Login with Google">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google Login" />
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
              Don&apos;t have an account?{" "}
              <span onClick={goToRegister} className="register-link">Sign up</span>
            </IonText>

            {/* Alerts */}
            <IonAlert
              isOpen={showAlert}
              message={alertMessage}
              buttons={["OK"]}
              onDidDismiss={() => setShowAlert(false)}
            />

            {/* Username Modal for Google users */}
            <IonModal isOpen={showUsernameModal} onDidDismiss={() => setShowUsernameModal(false)}>
              <IonContent className="ion-padding">
                <h2>Choose a Username</h2>
                <IonItem>
                  <IonIcon icon={personCircleOutline} slot="start" />
                  <IonInput
                    value={newUsername}
                    placeholder="Enter a username"
                    onIonChange={(e) => setNewUsername(e.detail.value!)}
                  />
                </IonItem>
                <IonButton expand="block" onClick={saveNewUsername} style={{ marginTop: 20 }}>
                  Save Username
                </IonButton>
              </IonContent>
            </IonModal>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
