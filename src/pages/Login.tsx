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
  useIonToast,
  useIonRouter,
} from "@ionic/react";
import { mailOutline, lockClosedOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

// ✅ Redirect URL (handles web + android + ios)
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return "com.greenpoints.ios://oauth-callback"; // must match Supabase redirect entry
  }
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost")) {
      return "http://localhost:8100/GreenPoints/oauth-callback";
    }
    if (origin.includes("github.io")) {
      return "https://kristanrey.github.io/GreenPoints/oauth-callback";
    }
  }
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

  // ✅ Insert login log (kept as is)
  const insertLoginLog = async (userId: string, email: string) => {
    try {
      await supabase.from("logs").insert([
        {
          user_id: userId,
          email,
          action: "login",
        },
      ]);
    } catch (err) {
      console.error("Log insert error:", err);
    }
  };

  // ✅ Email/Password Login
  const doLogin = async () => {
    if (!email || !password) {
      setAlertMessage("Please fill in both fields.");
      setShowAlert(true);
      return;
    }

    try {
      localStorage.removeItem("currentUser");

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("email not confirmed")) {
          setAlertMessage("Please confirm your email before logging in.");
        } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
          setAlertMessage("Invalid email or password.");
        } else {
          setAlertMessage(authError.message);
        }
        setShowAlert(true);
        return;
      }

      const user = data.user;
      if (!user) {
        setAlertMessage("Login failed: no user returned");
        setShowAlert(true);
        return;
      }

      // Fetch profile
      const { data: fetchedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Save user locally
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: user.id,
          name: fetchedProfile?.username || email,
          email: user.email,
          role: fetchedProfile?.role || "User",
          treesPlanted: fetchedProfile?.trees_planted || 0,
          greenpoints: fetchedProfile?.greenpoints || 0,
        })
      );

      // Insert login log once
      await insertLoginLog(user.id, user.email || "");

      presentToast({
        message: "Login Success!",
        duration: 2000,
        position: "top",
        color: "success",
      });

      router.push("/GreenPoints/userdashboard");
    } catch (err: any) {
      setAlertMessage(err.message || "Login failed");
      setShowAlert(true);
      console.error("Login error:", err);
    }
  };

  // ✅ Google OAuth
  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem("currentUser");
      await supabase.auth.signOut().catch(() => {});
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl, queryParams: { prompt: "select_account" } },
      });
      if (error) throw error;

      if (data?.url && Capacitor.isNativePlatform()) {
        await Browser.open({ url: data.url });
      }
    } catch (err: any) {
      setAlertMessage("Google Sign-In failed: " + (err?.message || "Unknown error"));
      setShowAlert(true);
      console.error("Google login error:", err);
    }
  };

  // ✅ Facebook OAuth
  const loginWithFacebook = async () => {
    try {
      localStorage.removeItem("currentUser");
      await supabase.auth.signOut().catch(() => {});
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;

      if (data?.url && Capacitor.isNativePlatform()) {
        await Browser.open({ url: data.url });
      }
    } catch (err: any) {
      setAlertMessage("Facebook Sign-In failed: " + (err?.message || "Unknown error"));
      setShowAlert(true);
      console.error("Facebook login error:", err);
    }
  };

  // ✅ iOS/Android OAuth redirect handler
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.addListener("appUrlOpen", async (data: any) => {
        if (data.url.includes("oauth-callback")) {
          try {
            const { data: session } = await supabase.auth.getSession();
            console.log("OAuth session:", session);

            if (session?.session) {
              router.push("/GreenPoints/userdashboard");
            }
          } catch (err) {
            console.error("Error handling OAuth callback:", err);
          }
          await Browser.close();
        }
      });
    }
  }, [router]);

  // ✅ NEW: Logout handler
  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await supabase.auth.signOut();
      } else {
        await supabase.auth.signOut({ scope: "global" });
      }
      localStorage.removeItem("currentUser");
      router.push("/GreenPoints/login");
    } catch (err) {
      console.error("Error logging out:", err);
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
              />
            </IonItem>

            <IonButton expand="block" onClick={doLogin} className="login-button">
              Login
            </IonButton>

            <IonText className="login-or">or</IonText>

            <div className="oauth-buttons">
              <div onClick={loginWithGoogle} className="oauth-icon" role="button">
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google Login"
                />
              </div>
              <div onClick={loginWithFacebook} className="oauth-icon" role="button">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
                  alt="Facebook Login"
                  className="facebook-icon"
                />
              </div>
            </div>

            {/* 🔹 Logout button */}
            <IonButton expand="block" color="medium" onClick={handleLogout}>
              Logout
            </IonButton>

            <IonText className="register-text">
              Don&apos;t have an account?{" "}
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
