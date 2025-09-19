import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonText,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
  IonImg,
  IonCardHeader,
  IonCardTitle,
  useIonRouter,
} from "@ionic/react";
import {
  leaf,
  gift,
  podium,
  person,
  camera,
  logOut,
  chatbox,
  newspaper,
  settings,
} from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";
import TreeAnimation from "../components/TreeAnimation";
import "./UserDashboard.css";

const UserDashboard: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [treesPlanted, setTreesPlanted] = useState(0);
  const [greenpoints, setGreenpoints] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const router = useIonRouter();

  // Fetch user data
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

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, trees_planted, greenpoints, avatar_url")
      .eq("user_id", user.id)
      .single();

    setUserName(profileData?.username || "Guest");
    setTreesPlanted(profileData?.trees_planted || 0);
    setGreenpoints(profileData?.greenpoints || 0);
    setAvatarUrl(profileData?.avatar_url || null);

    // Fetch streak points
    const { data: streakData } = await supabase
      .from("streak")
      .select("total_points")
      .eq("user_id", user.id)
      .single();

    if (streakData) {
      setGreenpoints((prev) => (prev || 0) + (streakData.total_points || 0));
    }

    // Pending submissions
    const { count } = await supabase
      .from("tree_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    setPendingSubmissions(count || 0);

    // Latest news
    const { data: news } = await supabase
      .from("news")
      .select("id, title, content, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (news) setNewsList(news);

    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // --- Fixed logout function ---
  const handleLogout = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFeedback("❌ No user logged in.");
        setShowToast(true);
        return;
      }

      // Update last login log with logout_time
      const { data: lastLog } = await supabase
        .from("logs")
        .select("logs_id")
        .eq("user_id", user.id)
        .eq("action", "login")
        .order("login_time", { ascending: false })
        .limit(1)
        .single();

      if (lastLog?.logs_id) {
        await supabase
          .from("logs")
          .update({ logout_time: new Date().toISOString() })
          .eq("logs_id", lastLog.logs_id);
      }

      await supabase.auth.signOut();

      setFeedback("👋 Logged out successfully!");
      setShowToast(true);

      setTimeout(() => {
        router.push("/GreenPoints/login", "forward", "replace");
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      setFeedback("❌ Logout failed.");
      setShowToast(true);
    }
  };

  if (loading) {
    return (
      <IonPage key="loading">
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" />
          <p>Loading your dashboard...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage key={window.location.pathname}>
      <IonContent fullscreen className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="welcome-section">
            {avatarUrl ? (
              <IonImg src={avatarUrl} className="profile-avatar" />
            ) : (
              <IonIcon icon={person} className="welcome-icon" />
            )}
            <div className="welcome-text">
              Welcome back, <strong>{userName}</strong>
            </div>
          </div>

          {/* Settings Dropdown */}
          <div className="settings-dropdown">
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setShowSettings(!showSettings)}
            >
              <IonIcon icon={settings} slot="icon-only" />
            </IonButton>

            {showSettings && (
              <div className="dropdown-menu">
                <a href="/GreenPoints/rewards">🎁 Rewards</a>
                <a href="/GreenPoints/editprofile">✏️ Edit Profile</a>
                <a href="#" onClick={handleLogout}>
                  🚪 Logout
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tree Animation */}
        <TreeAnimation treesPlanted={treesPlanted} greenpoints={greenpoints} />

        {/* Stats Card */}
        <IonCard className="stats-card">
          <IonCardContent>
            <div className="stat-item">
              <IonIcon icon={leaf} className="stat-icon tree-icon" />
              <div className="stat-details">
                <IonText className="stat-value">{treesPlanted}</IonText>
                <IonText className="stat-label">Trees Planted</IonText>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <IonIcon icon={gift} className="stat-icon greenpoints-icon" />
              <div className="stat-details">
                <IonText className="stat-value">{greenpoints}</IonText>
                <IonText className="stat-label">Greenpoints</IonText>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Action Buttons */}
        <div className="action-buttons">
          <IonButton expand="block" className="dashboard-button" color="tertiary" href="/GreenPoints/streak">
            <IonIcon icon={podium} slot="start" />
            Monitor Status
          </IonButton>
          <IonButton expand="block" className="dashboard-button" color="success" href="/GreenPoints/submittree">
            <IonIcon icon={camera} slot="start" />
            Submit New Tree
          </IonButton>
          <IonButton expand="block" className="dashboard-button" color="tertiary" href="/GreenPoints/leaderboard">
            <IonIcon icon={podium} slot="start" />
            View Leaderboard
          </IonButton>
          <IonButton expand="block" className="dashboard-button" color="primary" href="/GreenPoints/feedback">
            <IonIcon icon={chatbox} slot="start" />
            Feedback
          </IonButton>
        </div>

        {/* News Section */}
        <h2 className="section-title">
          <IonIcon icon={newspaper} /> Latest News
        </h2>

        {newsList.length > 0 ? (
          newsList.map((news) => (
            <IonCard key={news.id} className="news-card">
              {news.image_url && (
                <IonImg src={news.image_url} alt={news.title} className="news-image" />
              )}
              <IonCardHeader>
                <IonCardTitle>{news.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  {news.content.length > 120
                    ? news.content.substring(0, 120) + "..."
                    : news.content}
                </p>
                <small>📅 {new Date(news.created_at).toLocaleDateString()}</small>
                <div style={{ marginTop: "10px", textAlign: "right" }}>
                  <IonButton size="small" fill="outline" color="primary" href={`/GreenPoints/news/${news.id}`}>
                    Read More
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        ) : (
          <p className="ion-text-center">No news available.</p>
        )}

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
    </IonPage>
  );
};

export default UserDashboard;