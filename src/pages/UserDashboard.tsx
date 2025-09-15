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
  IonSpinner,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonImg,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import {
  home,
  leaf,
  gift,
  person,
  camera,
  podium,
  logOut,
  chatbox,
  newspaper,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
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
  const [activeTab, setActiveTab] = useState("home");

  // 🔹 News state
  const [newsList, setNewsList] = useState<any[]>([]);

  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("rewards")) setActiveTab("rewards");
    else if (path.includes("editprofile")) setActiveTab("profile");
    else if (path.includes("dashboard")) setActiveTab("home");
  }, [location]);

  const navigateTo = (path: string) => {
    history.push(path);
  };

  const handleViewRewards = () => navigateTo("/GreenPoints/rewards");
  const handleViewProfile = () => navigateTo("/GreenPoints/editprofile");
  const handleViewHome = () => navigateTo("/GreenPoints/dashboard");

  // Fetch user profile + news
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
      .select("username, trees_planted, greenpoints, avatar_url")
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
      setAvatarUrl(data?.avatar_url || null);
    }

    const { count, error: submissionsError } = await supabase
      .from("tree_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (!submissionsError) {
      setPendingSubmissions(count || 0);
    }

    // 🔹 Fetch latest news with image_url
    const { data: news, error: newsError } = await supabase
      .from("news")
      .select("id, title, content, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!newsError && news) {
      setNewsList(news);
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
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setTreesPlanted(updated.trees_planted || 0);
          setGreenpoints(updated.greenpoints || 0);
          setAvatarUrl(updated.avatar_url || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setFeedback("👋 Logged out successfully!");
    setShowToast(true);
    setTimeout(() => navigateTo("/GreenPoints/login"), 1500);
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
            {avatarUrl ? (
              <IonImg src={avatarUrl} className="profile-avatar" />
            ) : (
              <IonIcon icon={person} className="welcome-icon" />
            )}
            <div className="welcome-text">
              Welcome back, <strong>{userName}</strong>
            </div>
          </div>
          <IonButton fill="clear" size="small" onClick={handleLogout} title="Logout">
            <IonIcon icon={logOut} slot="icon-only" />
          </IonButton>
        </div>

        {/* Tree Animation */}
        <TreeAnimation treesPlanted={treesPlanted} greenpoints={greenpoints} />

        {/* Stats Card */}
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
          <IonButton expand="block" className="dashboard-button" color="tertiary" onClick={() => navigateTo("/GreenPoints/status")}>
            <IonIcon icon={podium} slot="start" />
            Monitor Status
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="success" onClick={() => navigateTo("/GreenPoints/submittree")}>
            <IonIcon icon={camera} slot="start" />
            Submit New Tree
          </IonButton>

          <IonButton expand="block" className="dashboard-button" onClick={handleViewRewards}>
            <IonIcon icon={gift} slot="start" />
            View Rewards
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="tertiary" onClick={() => navigateTo("/GreenPoints/leaderboard")}>
            <IonIcon icon={podium} slot="start" />
            View Leaderboard
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="primary" onClick={() => navigateTo("/GreenPoints/feedback")}>
            <IonIcon icon={chatbox} slot="start" />
            Feedback
          </IonButton>
        </div>

      {/* 🔹 News Section */}
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
        <small>
          📅 {new Date(news.created_at).toLocaleDateString()}
        </small>
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

      {/* Bottom Navigation */}
      <IonFooter>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" onClick={handleViewHome} className={activeTab === "home" ? "tab-active" : ""}>
            <IonIcon icon={home} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>

          <IonTabButton tab="rewards" onClick={handleViewRewards} className={activeTab === "rewards" ? "tab-active" : ""}>
            <IonIcon icon={gift} />
            <IonLabel>Rewards</IonLabel>
          </IonTabButton>

          <IonTabButton tab="profile" onClick={handleViewProfile} className={activeTab === "profile" ? "tab-active" : ""}>
            <IonIcon icon={person} />
            <IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default UserDashboard;
