import {
  IonAvatar,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonModal,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  IonText,
  IonAlert,
  IonSelect,
  IonSelectOption,
  useIonRouter,
  useIonToast,
} from "@ionic/react";
import { useState } from "react";

const Register: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [username, setUsername] = useState(""); // Only use username
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");

  const handleRegister = () => {
    if (!username || !password || !confirmPassword || !role) {
      setAlertMessage("All fields are required!");
      setShowAlert(true);
      return;
    }

    if (password !== confirmPassword) {
      setAlertMessage("Passwords do not match!");
      setShowAlert(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmRegistration = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    users.push({
      username,
      password,
      role,
      treesPlanted: 0,
      greenpoints: 0,
    });

    localStorage.setItem("users", JSON.stringify(users));

    // Optional: store as current user
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        username,
        password,
        role,
        treesPlanted: 0,
        greenpoints: 0,
      })
    );

    setShowConfirmModal(false);

    presentToast({
      message: `Registered as ${role.toUpperCase()}!`,
      duration: 2000,
      position: "top",
      color: "success",
    });

    router.push("/GreenPoints"); // Go to login
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <IonRow>
            <IonCol className="ion-text-center">
              <IonAvatar style={{ width: "100px", height: "100px", margin: "auto" }}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Tree_icon.svg/2048px-Tree_icon.svg.png"
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </IonAvatar>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonInput
          label="Username"
          value={username}
          onIonChange={(e) => setUsername(e.detail.value!)}
          placeholder="Enter your username"
        />
        <IonInput
          type="password"
          label="Password"
          value={password}
          onIonChange={(e) => setPassword(e.detail.value!)}
          placeholder="Enter password"
        />
        <IonInput
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onIonChange={(e) => setConfirmPassword(e.detail.value!)}
          placeholder="Confirm password"
        />

        <IonText>Select Your Role</IonText>
        <IonSelect
          value={role}
          placeholder="Select Role"
          onIonChange={(e) => setRole(e.detail.value)}
        >
          <IonSelectOption value="user">🌱 User (Tree Grower)</IonSelectOption>
          <IonSelectOption value="validator">✅ Barangay Validator</IonSelectOption>
          <IonSelectOption value="cenro">🏢 CENRO</IonSelectOption>
          <IonSelectOption value="admin">🛠 Admin</IonSelectOption>
        </IonSelect>

        <IonButton onClick={handleRegister} expand="full" style={{ marginTop: "20px" }}>
          Register
        </IonButton>

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          message={alertMessage}
          buttons={["OK"]}
          onDidDismiss={() => setShowAlert(false)}
        />

        {/* Confirm Modal */}
        <IonModal isOpen={showConfirmModal}>
          <IonContent className="ion-padding">
            <IonText>
              Confirm registration for <strong>{username}</strong> as <strong>{role}</strong>?
            </IonText>
            <IonButton expand="full" color="success" onClick={confirmRegistration}>
              Confirm & Register
            </IonButton>
            <IonButton expand="full" color="danger" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Register;
