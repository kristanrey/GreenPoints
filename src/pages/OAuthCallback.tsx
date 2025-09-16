// src/pages/OAuthCallback.tsx
import { useEffect, useState } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { useIonRouter } from "@ionic/react";

const getRedirectUrl = () => {
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

const OAuthCallback: React.FC = () => {
  const router = useIonRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Ensure session is ready
        await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/GreenPoints/login");
          return;
        }

        // Check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        let finalProfile = profile;

        if (!profile) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert([
              {
                user_id: user.id,
                email: user.email,
                username: null,
                role: "User",
                trees_planted: 0,
                greenpoints: 0,
              },
            ])
            .select()
            .single();
          finalProfile = newProfile;
        }

        // Save locally
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: user.id,
            name: finalProfile?.username || user.email,
            email: user.email,
            role: finalProfile?.role || "User",
            treesPlanted: finalProfile?.trees_planted || 0,
            greenpoints: finalProfile?.greenpoints || 0,
          })
        );

        // ✅ Avoid duplicate log (set flag in sessionStorage)
        const logKey = `oauthLog-${user.id}`;
        if (!sessionStorage.getItem(logKey)) {
          await supabase.from("logs").insert([
            { user_id: user.id, email: user.email, action: "login" },
          ]);
          sessionStorage.setItem(logKey, "true");
        }

        // If username is empty, force set
        if (!finalProfile?.username) {
          router.push("/GreenPoints/set-username");
        } else {
          router.push("/GreenPoints/userdashboard");
        }
      } catch (err) {
        console.error("OAuth handling error:", err);
        router.push("/GreenPoints/login");
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <IonPage>
      <IonContent className="ion-text-center">
        {loading && <IonSpinner name="crescent" />}
      </IonContent>
    </IonPage>
  );
};

export default OAuthCallback;
