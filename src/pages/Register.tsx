
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validateEmail = (email: string) => {
    return email.endsWith("@nbsc.edu.ph");
  };

  const handleRegister = () => {
    if (!validateEmail(email)) {
      setAlertMessage("Only @nbsc.edu.ph emails are allowed!");
      setShowAlert(true);
      return;
    }
    if (password !== confirmPassword) {
      setAlertMessage("Passwords do not match!");
      setShowAlert(true);
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmRegistration = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    users.push({ email, password });
    localStorage.setItem("users", JSON.stringify(users));

    setShowConfirmModal(false);
    presentToast({
      message: "Registration Successful!",
      duration: 2000,
      position: "top",
      color: "success",
    });

    router.push("/GreenPoints"); // Redirect to login
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
        <img src="https://scontent.fceb8-1.fna.fbcdn.net/v/t39.30808-1/373517144_10006395102767259_3385756574041204882_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=100&ccb=1-7&_nc_sid=e99d92&_nc_eui2=AeHBrFaQij8eDgSuEsVdtzwujoTTnHYPDyiOhNOcdg8PKDGM2CFS1CwOynjLEQU__nSeMWHgMNodej7rK_hmYIj3&_nc_ohc=OtcpRFFXc10Q7kNvgF-U2AF&_nc_oc=Adj7hKROWsqIU5z2Gj_n1XlsnoMrW5sgS0ex3TNXvLdF2ASFxGK8U6py5AIlwRcNNn0_VgNwnSHfqOz1HIAnEumU&_nc_zt=24&_nc_ht=scontent.fceb8-1.fna&_nc_gid=AscMIHAs1IBSSXGO0o1OjgF&oh=00_AYHRNwOAHBZnpgJDS0h8u2xd9DS6Eg4cWrnJCK6buA5BDQ&oe=67D495D4" alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </IonAvatar>
    </IonCol>
  </IonRow>
</IonGrid>

        <IonInput label="Email" type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} placeholder="Enter email" />
        <IonInput type="password" label="Password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} placeholder="Enter password" />
        <IonInput type="password" label="Confirm Password" value={confirmPassword} onIonChange={(e) => setConfirmPassword(e.detail.value!)} placeholder="Confirm password" />
        <IonButton onClick={handleRegister} expand="full">
          Register
        </IonButton>

        {/* Alert for errors */}
        <IonAlert isOpen={showAlert} message={alertMessage} buttons={["OK"]} onDidDismiss={() => setShowAlert(false)} />

        {/* Confirmation Modal */}
        <IonModal isOpen={showConfirmModal}>
          <IonContent className="ion-padding">
            <IonText>Confirm your details before registering?</IonText>
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
