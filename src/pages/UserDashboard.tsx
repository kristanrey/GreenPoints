  // src/pages/UserDashboard.tsx
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
    IonFooter,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonBadge,
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
    logOut,
    chatbox,
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
    const [pendingSubmissions, setPendingSubmissions] = useState(0);
    const [activeTab, setActiveTab] = useState("home");

    // ✅ Fetch user profile
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

      // ✅ FIX: Use user_id not id
      const { data, error } = await supabase
        .from("profiles")
        .select("username, trees_planted, greenpoints")
        .eq("user_id", user.id)
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

      // ✅ Pending submissions count
      const { count, error: submissionsError } = await supabase
        .from("tree_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (!submissionsError) {
        setPendingSubmissions(count || 0);
      }

      setLoading(false);
    };

    useEffect(() => {
      fetchUserData();
    }, []);

    // ✅ Realtime updates for profile
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
            filter: `user_id=eq.${userId}`, // ✅ FIXED
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

    // ✅ Handle logout
    const handleLogout = async () => {
      await supabase.auth.signOut();
      setFeedback("👋 Logged out successfully!");
      setShowToast(true);
      setTimeout(() => (window.location.href = "/GreenPoints/login  "), 1500);
    };

    // ✅ Capture & submit tree photo
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

        // ✅ FIX: Use user_id not id
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          setFeedback("❌ Error fetching user profile.");
          setShowToast(true);
          setSubmitting(false);
          return;
        }

        const userFolder = `user-${profileData?.username || user.id}`;
        const fileName = `${Date.now()}.jpg`;
        const fullPath = `${userFolder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("tree_submissions")
          .upload(fullPath, dataURLtoBlob(image.dataUrl), {
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
          .getPublicUrl(fullPath);

        const { error } = await supabase.from("tree_submissions").insert([
          {
            user_id: user.id,
            status: "pending",
            image_url: publicUrlData.publicUrl,
            image_path: fullPath,
            description: "Planted a new tree 🌱",
          },
        ]);

        if (error) {
          setFeedback(`❌ Failed to submit tree: ${error.message}`);
        } else {
          setFeedback("✅ Tree photo submitted! Awaiting validation.");
          setPendingSubmissions((prev) => prev + 1);
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

    // ✅ Convert DataURL → Blob
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

    // Rewards & Profile
    const handleViewRewards = () => {
      setActiveTab("rewards");
      setFeedback(
        `🎁 You have ${greenpoints} GreenPoints to redeem! Check out our rewards catalog.`
      );
      setShowToast(true);
    };

    const handleViewProfile = () => {
      setActiveTab("profile");
      setFeedback("👤 Viewing your profile information.");
      setShowToast(true);
    };

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
          {/* Header */}
          <div className="dashboard-header">
            <div className="welcome-section">
              <IonIcon icon={person} className="welcome-icon" />
              <div className="welcome-text">
                Welcome back, <strong>{userName}</strong>
              </div>
            </div>
            <IonButton
              fill="clear"
              size="small"
              onClick={handleLogout}
              title="Logout"
            >
              <IonIcon icon={logOut} slot="icon-only" />
            </IonButton>
          </div>

          {/* Stats */}
          <IonCard className="stats-card">
            <IonCardContent>
              <div className="stat-item">
                <div className="stat-icon-container">
                  <IonIcon icon={leaf} className="stat-icon tree-icon" />
                </div>
                <div className="stat-details">
                  <IonText className="stat-value">{treesPlanted}</IonText>
                  <IonText className="stat-label">Trees Planted</IonText>
                </div>
              </div>

              <div className="stat-divider"></div>

              <div className="stat-item">
                <div className="stat-icon-container">
                  <IonIcon icon={gift} className="stat-icon greenpoints-icon" />
                </div>
                <div className="stat-details">
                  <IonText className="stat-value">{greenpoints}</IonText>
                  <IonText className="stat-label">Greenpoints</IonText>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Action Buttons */}
          <div className="action-buttons">
            <IonButton
              expand="block"
              className="dashboard-button"  
              color="tertiary"
              routerLink="/leaderboard"
            >
              <IonIcon icon={podium} slot="start" />
              Monitor Status
            </IonButton>
          
<IonButton
  expand="block"
  className="dashboard-button"
  color="success"
  routerLink="/GreenPoints/submittree"
  disabled={submitting}
>
  <IonIcon icon={camera} slot="start" />
  Submit New Tree
</IonButton>



            <IonButton
              expand="block"
              className="dashboard-button"
              onClick={handleViewRewards}
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
             
             <IonButton
              expand="block"
              className="dashboard-button"
              color="primary"
              routerLink="/feedback"
            >
              <IonIcon icon={chatbox} slot="start" />
              Feedback
            </IonButton>
          </div>

          {/* Tabs */}
          <div className="tab-content">
            {activeTab === "home" && (
              <IonCard>
                <IonCardContent>
                  <h3>Recent Activity</h3>
                  <p>Your recent tree planting activities will appear here.</p>
                </IonCardContent>
              </IonCard>
            )}

            {activeTab === "rewards" && (
              <IonCard>
                <IonCardContent>
                  <h3>Available Rewards</h3>
                  <p>Use your GreenPoints to redeem these exciting rewards:</p>
                  <div className="rewards-list">
                    <div className="reward-item">
                      <IonIcon icon={gift} />
                      <span>Planter's Kit (50 points)</span>
                    </div>
                    <div className="reward-item">
                      <IonIcon icon={gift} />
                      <span>Eco-friendly Water Bottle (100 points)</span>
                    </div>
                    <div className="reward-item">
                      <IonIcon icon={gift} />
                      <span>Tree Adoption Certificate (150 points)</span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {activeTab === "profile" && (
              <IonCard>
                <IonCardContent>
                  <h3>Your Profile</h3>
                  <p>
                    <strong>Username:</strong> {userName}
                  </p>
                  <p>
                    <strong>Member Since:</strong>{" "}
                    {new Date().toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Current Status:</strong> Eco Warrior 🌿
                  </p>
                </IonCardContent>
              </IonCard>
            )}
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
              <p className="ion-text-center">
                Please take a clear photo of the tree you planted for verification.
              </p>

              <div className="camera-modal-buttons">
                <IonButton
                  expand="full"
                  color="success"
                  onClick={handleTakePhoto}
                  disabled={submitting}
                >
                  {submitting ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={checkmarkDoneCircle} slot="start" />
                      Take Photo & Submit
                    </>
                  )}
                </IonButton>

                <IonButton
                  expand="full"
                  color="medium"
                  onClick={() => setShowCameraModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </IonButton>
              </div>
            </IonContent>
          </IonModal>

          <IonToast
            isOpen={showToast}
            message={feedback}
            duration={3000}
            onDidDismiss={() => {
              setShowToast(false);
              setFeedback("");
            }}
          />
        </IonContent>

        {/* Bottom Navigation */}
        <IonFooter>
          <IonTabBar slot="bottom">
            <IonTabButton
              tab="home"
              onClick={() => setActiveTab("home")}
              className={activeTab === "home" ? "tab-active" : ""}
            >
              <IonIcon icon={home} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>

            <IonTabButton
              tab="rewards"
              onClick={handleViewRewards}
              className={activeTab === "rewards" ? "tab-active" : ""}
            >
              <IonIcon icon={gift} />
              <IonLabel>Rewards</IonLabel>
            </IonTabButton>

           <IonTabButton
  tab="profile"
  href="/GreenPoints/EditProfile"   // 👈 use href to navigate
  className={activeTab === "profile" ? "tab-active" : ""}
>
  <IonIcon icon={person} />
  <IonLabel>Profile</IonLabel>
</IonTabButton>

          </IonTabBar>
        </IonFooter>
      </IonPage>
    );
  };

  export default UserDashboard;
