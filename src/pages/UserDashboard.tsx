import {
  IonPage,
  IonContent,
  IonText,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonToast,
  IonModal,
  IonSpinner,
} from "@ionic/react";
import {
  home,
  leaf,
  gift,
  person,
  camera,
  statsChart,
  checkmarkDoneCircle,
  podium,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import "./UserDashboard.css";

const UserDashboard: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [treesPlanted, setTreesPlanted] = useState(0);
  const [greenpoints, setGreenpoints] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user profile
  const fetchUserData = async () => {
    setFeedback("");
    setShowToast(false);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setFeedback("❌ No user logged in.");
      setShowToast(true);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("username, trees_planted, greenpoints")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      setFeedback("❌ Failed to load profile.");
      setShowToast(true);
    } else {
      setUserName(data?.username || "Guest");
      setTreesPlanted(data?.trees_planted || 0);
      setGreenpoints(data?.greenpoints || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Realtime updates for profile
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setTreesPlanted(updated.trees_planted || 0);
          setGreenpoints(updated.greenpoints || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Capture and submit tree photo
  const handleTakePhoto = async () => {
    try {
      setSubmitting(true);
      setFeedback("📸 Opening camera...");
      setShowToast(true);

      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!image || !image.dataUrl) {
        setFeedback("❌ No photo taken.");
        setShowToast(true);
        setSubmitting(false);
        return;
      }

      setFeedback("📤 Uploading your tree photo...");
      setShowToast(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFeedback("❌ You must be logged in to submit.");
        setShowToast(true);
        setSubmitting(false);
        return;
      }

      const fileName = `trees/${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("tree_submissions")
        .upload(fileName, dataURLtoBlob(image.dataUrl), {
          contentType: "image/jpeg",
        });

      if (uploadError) {
        setFeedback(`❌ Upload failed: ${uploadError.message}`);
        setShowToast(true);
        setSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("tree_submissions")
        .getPublicUrl(fileName);

      const { error } = await supabase.from("tree_submissions").insert([
        {
          user_id: user.id,
          status: "pending",
          image_url: publicUrlData.publicUrl,
          description: "Planted a new tree 🌱",
        },
      ]);

      if (error) {
        setFeedback(`❌ Failed to submit tree: ${error.message}`);
      } else {
        setFeedback("✅ Tree photo submitted! Awaiting validation.");
      }
      setShowToast(true);
    } catch (err) {
      console.error("Camera error:", err);
      setFeedback("❌ Failed to take photo.");
      setShowToast(true);
    } finally {
      setSubmitting(false);
      setShowCameraModal(false);
    }
  };

  // Convert DataURL to Blob
  function dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" />
          <p>Loading your dashboard...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="dashboard-content">
        <div className="welcome-text">
          <IonIcon
            icon={person}
            style={{ marginRight: 8, verticalAlign: "middle" }}
          />
          Welcome back, <strong>{userName}</strong>
        </div>

        <IonCard className="stats-card">
          <IonCardContent>
            <div className="stat-item">
              <IonIcon
                icon={leaf}
                className="tree-icon"
                style={{ color: "#2ecc71", marginRight: 8 }}
              />
              <IonText className="stat-label">Trees Planted</IonText>
              <IonText className="stat-value">{treesPlanted}</IonText>
            </div>
            <hr className="divider" />
            <div className="stat-item">
              <IonIcon
                icon={gift}
                className="greenpoints-icon"
                style={{ color: "#f1c40f", marginRight: 8 }}
              />
              <IonText className="stat-label">Greenpoints Earned</IonText>
              <IonText className="stat-value">{greenpoints}</IonText>
            </div>
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          className="dashboard-button"
          onClick={() => {
            setFeedback("📊 Your submissions are under review.");
            setShowToast(true);
          }}
          disabled={submitting}
        >
          <IonIcon icon={statsChart} slot="start" />
          Monitor Status
        </IonButton>

        <IonButton
          expand="block"
          className="dashboard-button"
          color="success"
          onClick={() => setShowCameraModal(true)}
          disabled={submitting}
        >
          <IonIcon icon={camera} slot="start" />
          Submit New Tree
        </IonButton>

        <IonButton
          expand="block"
          className="dashboard-button"
          onClick={() => {
            setFeedback(`🎁 You have ${greenpoints} GreenPoints to redeem!`);
            setShowToast(true);
          }}
          disabled={submitting}
        >
          <IonIcon icon={gift} slot="start" />
          View Rewards
        </IonButton>

        <IonButton
          expand="block"
          className="dashboard-button"
          color="tertiary"
          routerLink="/leaderboard"
        >
          <IonIcon icon={podium} slot="start" />
          View Leaderboard
        </IonButton>

        <div className="bottom-nav">
          <IonIcon icon={home} className="nav-icon" />
          <IonIcon icon={gift} className="nav-icon" />
          <IonIcon icon={person} className="nav-icon" />
        </div>

        {/* Camera Modal */}
        <IonModal
          isOpen={showCameraModal}
          onDidDismiss={() => setShowCameraModal(false)}
        >
          <IonContent className="ion-padding">
            <h2 style={{ textAlign: "center" }}>
              <IonIcon icon={camera} /> Take a Tree Photo
            </h2>
            <IonButton
              expand="full"
              color="success"
              onClick={handleTakePhoto}
              disabled={submitting}
            >
              <IonIcon icon={checkmarkDoneCircle} slot="start" />
              Take Photo & Submit
            </IonButton>
            <IonButton
              expand="full"
              color="medium"
              onClick={() => setShowCameraModal(false)}
              disabled={submitting}
            >
              Cancel
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          message={feedback}
          duration={2500}
          onDidDismiss={() => {
            setShowToast(false);
            setFeedback("");
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default UserDashboard;
  