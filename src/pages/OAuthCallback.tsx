// src/pages/OAuthCallback.tsx
import { useEffect, useState } from "react";
import { IonPage, IonContent, IonSpinner } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { useIonRouter } from "@ionic/react";

const OAuthCallback: React.FC = () => {
  const router = useIonRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // ✅ Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/GreenPoints/login");
          return;
        }

        const user = session.user;

        // ✅ Fetch profile from DB
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Profile fetch error:", error);
        }

        // ✅ If no profile row, insert it
        if (!profile) {
          await supabase.from("profiles").insert([
            {
              id: user.id,
              email: user.email,
              username: null, // will be set later
              role: "User",
              trees_planted: 0,
              greenpoints: 0,
            },
          ]);
          // force username setup
          router.push("/GreenPoints/set-username");
          return;
        }

        // ✅ If profile exists but username missing → redirect to set username
        if (!profile.username) {
          router.push("/GreenPoints/set-username");
          return;
        }

        // ✅ Always refresh localStorage with fresh data
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
        router.push("/GreenPoints/user-dashboard");
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
