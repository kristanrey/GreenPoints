// src/pages/AdminSettings.tsx
import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonToggle,
} from "@ionic/react";

const AdminSettings: React.FC = () => {
  const [adminName] = useState("Administrator");
  const [adminEmail] = useState("admin@greenpoints.com");
  const [newPassword, setNewPassword] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [theme, setTheme] = useState("light");

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const handleChangePassword = () => {
    if (newPassword.trim() === "") {
      alert("Please enter a new password.");
      return;
    }

    localStorage.setItem("adminPassword", newPassword);
    setShowToast(true);
    setNewPassword("");
  };

  const handleThemeToggle = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.classList.toggle("dark", checked);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>⚙️ Admin Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2>Admin Information</h2>
        <IonItem>
          <IonLabel>Name: {adminName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Email: {adminEmail}</IonLabel>
        </IonItem>

        <h2 style={{ marginTop: "20px" }}>Change Password</h2>
        <IonItem>
          <IonLabel position="floating">New Password</IonLabel>
          <IonInput
            type="password"
            value={newPassword}
            onIonChange={(e) => setNewPassword(e.detail.value!)}
          />
        </IonItem>
        <IonButton expand="block" color="success" onClick={handleChangePassword}>
          Update Password
        </IonButton>

        <h2 style={{ marginTop: "20px" }}>Preferences</h2>
        <IonItem>
          <IonLabel>Dark Mode</IonLabel>
          <IonToggle
            checked={theme === "dark"}
            onIonChange={(e) => handleThemeToggle(e.detail.checked)}
          />
        </IonItem>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Password updated successfully!"
          duration={2000}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminSettings;
