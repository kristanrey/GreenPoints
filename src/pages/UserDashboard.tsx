// src/pages/UserDashboard.tsx
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
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
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
  settingsOutline,
  calendar,
  searchOutline,
} from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";
import TreeAnimation from "../components/TreeAnimation";
import "./css/UserDashboard.css";

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
  const [eventList, setEventList] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const router = useIonRouter();

  // Fetch user data + news + events
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

    // --- Base profile data ---
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("username, trees_planted, greenpoints, avatar_url")
      .eq("user_id", user.id)
      .single();

    let totalGreenpoints = 0;

    if (profileError) {
      setFeedback("❌ Failed to load profile.");
      setShowToast(true);
    } else {
      setUserName(profileData?.username || "Guest");
      setTreesPlanted(profileData?.trees_planted || 0);
      setAvatarUrl(profileData?.avatar_url || null);

      totalGreenpoints += profileData?.greenpoints || 0;
    }

    // --- Sum streak points ---
    const { data: streakData, error: streakError } = await supabase
      .from("user_streaks")
      .select("points_earned")
      .eq("user_id", user.id);

    if (!streakError && streakData) {
      const streakPoints = streakData.reduce(
        (sum, row) => sum + Number(row.points_earned || 0),
        0
      );
      totalGreenpoints += streakPoints;
    }

    // --- Sum monitor points ---
    const { data: monitorData, error: monitorError } = await supabase
      .from("tree_monitoring")
      .select("monitor_points")
      .eq("user_id", user.id);

    if (!monitorError && monitorData) {
      const monitorPoints = monitorData.reduce(
        (sum, row) => sum + (row.monitor_points || 0),
        0
      );
      totalGreenpoints += monitorPoints;
    }

    // ✅ Update final total
    setGreenpoints(totalGreenpoints);

    // --- Pending submissions ---
    const { count, error: submissionsError } = await supabase
      .from("tree_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (!submissionsError) setPendingSubmissions(count || 0);

    // --- Latest news ---
    const { data: news, error: newsError } = await supabase
      .from("news")
      .select("id, title, content, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!newsError && news) setNewsList(news);

    // --- Latest events ---
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        "event_id, title, description, date, registration_type, max_participants, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (!eventsError && events) setEventList(events);

    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Logout function
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
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Settings Menu */}
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <IonIcon icon={settingsOutline} slot="icon-only" />
            </IonButton>

            <IonPopover
              isOpen={showSettings}
              onDidDismiss={() => setShowSettings(false)}
            >
              <IonList>
                <IonItem
                  button
                  href="/GreenPoints/rewards"
                  onClick={() => setShowSettings(false)}
                >
                  <IonIcon icon={gift} slot="start" />
                  <IonLabel>Rewards</IonLabel>
                </IonItem>
                <IonItem
                  button
                  href="/GreenPoints/editprofile"
                  onClick={() => setShowSettings(false)}
                >
                  <IonIcon icon={person} slot="start" />
                  <IonLabel>Edit Profile</IonLabel>
                </IonItem>
              </IonList>
            </IonPopover>

            {/* Logout */}
            <IonButton
              fill="clear"
              size="small"
              onClick={handleLogout}
              title="Logout"
            >
              <IonIcon icon={logOut} slot="icon-only" />
            </IonButton>
          </div>
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
          <IonButton expand="block" className="dashboard-button" color="warning" href="/GreenPoints/streak">
            <IonIcon icon={podium} slot="start" />
            Achievements
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="success" href="/GreenPoints/submittree">
            <IonIcon icon={camera} slot="start" />
            Submit New Tree
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="success" href="/GreenPoints/appoinment">
            <IonIcon icon={calendar} slot="start" />
            Appointment
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="tertiary" href="/GreenPoints/leaderboard">
            <IonIcon icon={podium} slot="start" />
            View Leaderboard
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="primary" href="/GreenPoints/feedback">
            <IonIcon icon={chatbox} slot="start" />
            Feedback
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="danger" href="/GreenPoints/participate">
            <IonIcon icon={calendar} slot="start" />
            Event
          </IonButton>

          <IonButton expand="block" className="dashboard-button" color="primary" href="/GreenPoints/treemonitor">
            <IonIcon icon={searchOutline} slot="start" />
            Monitor Tree
          </IonButton>
        </div>

        {/* News Section */}
        <h2 className="section-title">
          <IonIcon icon={newspaper} /> Latest News
        </h2>

        {newsList.length > 0 ? (
          newsList.map((news) => (
            <IonCard key={news.id} className="news-card">
              {news.image_url && <IonImg src={news.image_url} alt={news.title} className="news-image" />}
              <IonCardHeader>
                <IonCardTitle>{news.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  {news.content.length > 120 ? news.content.substring(0, 120) + "..." : news.content}
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

        {/* Events Section */}
        <h2 className="section-title">
          <IonIcon icon={calendar} /> Upcoming Events
        </h2>

        {eventList.length > 0 ? (
          eventList.map((event) => (
            <IonCard key={event.event_id} className="news-card">
              <IonCardHeader>
                <IonCardTitle>{event.title}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  {event.description.length > 120 ? event.description.substring(0, 120) + "..." : event.description}
                </p>
                <small>
                  📅 {new Date(event.date).toLocaleDateString()} | {event.registration_type} | 🎟 Max:{" "}
                  {event.max_participants || "Unlimited"}
                </small>
                <div style={{ marginTop: "10px", textAlign: "right" }}>
                  <IonButton size="small" fill="outline" color="secondary" href={`/GreenPoints/events/${event.event_id}`}>
                    View Details
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        ) : (
          <p className="ion-text-center">No upcoming events.</p>
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
