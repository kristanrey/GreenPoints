// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonAvatar,
  IonText,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import "./css/EditProfile.css"; // ✅ custom styling

const ProfilePage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [treesPlanted, setTreesPlanted] = useState<number>(0);
  const [greenpoints, setGreenpoints] = useState<number>(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ✅ Fetch profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error("No user logged in", error);
        return;
      }

      setUserId(data.user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, email, role, trees_planted, greenpoints, avatar_url")
        .eq("user_id", data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        return;
      }

      if (profileData) {
        setUsername(profileData.username || "");
        setEmail(profileData.email || "");
        setRole(profileData.role || "");
        setTreesPlanted(profileData.trees_planted || 0);
        setGreenpoints(profileData.greenpoints || 0);
        setAvatarUrl(profileData.avatar_url || null);
      }
    };

    fetchProfile();
  }, []);

  // ✅ Save username + avatar URL
  const handleSave = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ username, avatar_url: avatarUrl })
      .eq("user_id", userId);

    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      alert("✅ Profile updated successfully!");
    }
  };

  // ✅ Upload avatar → storage/profiles/{user_id}/avatar.png
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !userId) return;

    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
   // ✅ fetch username for folder name
const { data: profileData } = await supabase
  .from("profiles")
  .select("username")
  .eq("user_id", userId)
  .single();

const username = profileData?.username || userId;

const filePath = `${username}/profile_image/avatar.${fileExt}`;

const { error: uploadError } = await supabase.storage
  .from("greenpoints")
  .upload(filePath, file, { upsert: true });

const { data: urlData } = supabase.storage.from("greenpoints").getPublicUrl(filePath);


    if (urlData?.publicUrl) {
      setAvatarUrl(urlData.publicUrl);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", userId);

      if (updateError) {
        alert("Error saving avatar URL: " + updateError.message);
      } else {
        alert("✅ Profile picture updated!");
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="profile-title">My Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* ✅ Background wrapper */}
      <IonContent fullscreen>
        <div className="profile-background">
          <div className="profile-container">
            {/* Avatar */}
            <div className="profile-avatar-container">
              <IonAvatar className="profile-avatar">
                <img src={avatarUrl || "https://via.placeholder.com/150"} alt="Profile" />
              </IonAvatar>

              <IonButton fill="outline" size="small" className="upload-btn">
                <label htmlFor="file-upload">Change Photo</label>
              </IonButton>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            {/* Username */}
            <IonItem className="profile-input">
              <IonLabel position="floating">Username</IonLabel>
              <IonInput
                value={username}
                onIonChange={(e) => setUsername(e.detail.value ?? "")}
              />
            </IonItem>

            {/* Email */}
            <IonItem className="profile-input">
              <IonLabel>Email</IonLabel>
              <IonText slot="end">{email}</IonText>
            </IonItem>

            {/* Role */}
            <IonItem className="profile-input">
              <IonLabel>Role</IonLabel>
              <IonText slot="end">{role}</IonText>
            </IonItem>

            {/* Trees Planted */}
            <IonItem className="profile-input">
              <IonLabel>Trees Planted</IonLabel>
              <IonText slot="end">{treesPlanted}</IonText>
            </IonItem>

            {/* GreenPoints */}
            <IonItem className="profile-input">
              <IonLabel>GreenPoints</IonLabel>
              <IonText slot="end">{greenpoints}</IonText>
            </IonItem>

            <IonButton expand="block" onClick={handleSave} className="save-btn">
              Save Changes
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;