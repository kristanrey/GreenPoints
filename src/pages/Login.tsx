
import {
  IonAvatar,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
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

const Login: React.FC = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const doLogin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      setAlertMessage("The username you entered isn’t connected to an account. Find your account and log in.");
      setShowAlert(true);
      return;
    }

    presentToast({
      message: "Login Success!",
      duration: 2000,
      position: "top",
      color: "success",
    });

    router.push("/GreenPoints/app");
  };

  const goToRegister = () => {
    router.push("/GreenPoints/register");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
      <IonGrid style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
  <IonRow>
    <IonCol className="ion-text-center">
      <IonAvatar style={{ width: "100px", height: "100px", margin: "auto" }}>
        <img src="https://i.pinimg.com/originals/43/3c/a7/433ca708c31bf70ffebb6ef6ea3365ab.jpg" alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </IonAvatar>
    </IonCol>
  </IonRow>
</IonGrid>

        <IonInput label="Email" type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} placeholder="Enter email" />
        <IonInput type="password" label="Password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} placeholder="Enter password">
          <IonInputPasswordToggle slot="end" />
        </IonInput>
        <IonButton onClick={doLogin} expand="full">
          Login
        </IonButton>

        <IonText color="primary" style={{ display: "block", marginTop: "15px", textAlign: "center" }}>
          Don't have an account?{" "}
          <span onClick={goToRegister} style={{ textDecoration: "underline", cursor: "pointer" }}>
            Sign up
          </span>
        </IonText>

        {/* Alert for incorrect login */}
        <IonAlert isOpen={showAlert} message={alertMessage} buttons={["OK"]} onDidDismiss={() => setShowAlert(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
