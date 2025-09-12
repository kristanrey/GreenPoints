// src/pages/OAuthCallback.tsx
import { useEffect, useState } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { useIonRouter } from "@ionic/react";

// ✅ Shared redirect URL logic (same as Login.tsx)
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

const OAuthCallback: React.FC = () => {
  const router = useIonRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // ✅ Refresh session in case redirect happened
        await supabase.auth.getSession();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/GreenPoints/login");
          return;
        }

        // ✅ Fetch profile by user_id
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Profile fetch error:", error);
        }

        // ✅ If no profile row, insert it
        if (!profile) {
          const { error: insertError } = await supabase.from("profiles").insert([
            {
              user_id: user.id,
              email: user.email,
              username: null, // force user to set later
              role: "User",
              trees_planted: 0,
              greenpoints: 0,
            },
          ]);

          if (insertError) {
            console.error("Profile insert error:", insertError);
            router.push("/GreenPoints/login");
            return;
          }

          router.push("/GreenPoints/set-username");
          return;
        }

        // ✅ If profile exists but username missing → redirect to set username
        if (!profile.username) {
          router.push("/GreenPoints/set-username");
          return;
        }

        // ✅ Save user to localStorage
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: user.id,
            name: profile.username,
            email: user.email,
            role: profile.role || "User",
            treesPlanted: profile.trees_planted || 0,
            greenpoints: profile.greenpoints || 0,
          })
        );

        // ✅ Go to dashboard
        router.push("/GreenPoints/userdashboard");
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
