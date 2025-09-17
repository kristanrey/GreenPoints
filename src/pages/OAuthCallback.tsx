import { useEffect, useState } from "react";
import { IonPage, IonContent, IonSpinner, useIonToast } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { useIonRouter } from "@ionic/react";

const OAuthCallback: React.FC = () => {
  const router = useIonRouter();
  const [loading, setLoading] = useState(true);
  const [presentToast] = useIonToast();

  // RLS-safe log insertion
  const insertLoginLog = async (userId: string, email: string) => {
    try {
      await supabase.from("logs").insert([
        {
          user_id: userId,
          email,
          action: "login",
          // logs_id and login_time handled by DB defaults
        },
      ]);
    } catch (err) {
      console.error("Log insert error:", err);
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error("Session error:", sessionError);

        if (!session?.user) {
          router.push("/GreenPoints/login");
          return;
        }

        const user = session.user;

        // Fetch existing profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        let finalProfile = profile;

        // If no profile exists, create one
        if (!profile) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert([
              {
                user_id: user.id,
                email: user.email,
                username: user.email ? user.email.split("@")[0] : "User",
                role: "User",
                trees_planted: 0,
                greenpoints: 0,
              },
            ])
            .select()
            .single();

          finalProfile = newProfile;
        }

        // Save user locally
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: user.id,
            name: finalProfile?.username || user.email || "User",
            email: user.email || "",
            role: finalProfile?.role || "User",
            treesPlanted: finalProfile?.trees_planted || 0,
            greenpoints: finalProfile?.greenpoints || 0,
          })
        );

        // Insert login log exactly once
        await insertLoginLog(user.id, user.email || "");

        presentToast({
          message: "Login Success!",
          duration: 2000,
          position: "top",
          color: "success",
        });

        // Redirect user
        if (!finalProfile?.username) {
          router.push("/GreenPoints/set-username");
        } else {
          router.push("/GreenPoints/userdashboard");
        }
      } catch (err: any) {
        console.error("OAuth handling error:", err);
        router.push("/GreenPoints/login");
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [router, presentToast]);

  return (
    <IonPage>
      <IonContent className="ion-text-center">
        {loading && <IonSpinner name="crescent" />}
      </IonContent>
    </IonPage>
  );
};

export default OAuthCallback;
