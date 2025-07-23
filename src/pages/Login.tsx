
// src/pages/Login.tsx
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
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

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

    router.push("/it35-lab/app");
  };

  const goToRegister = () => {
    router.push("/it35-lab/register");
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (tokenResponse.access_token) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        })
          .then(res => res.json())
          .then(decoded => {
            const googleEmail = decoded.email;
            const users = JSON.parse(localStorage.getItem("users") || "[]");
            const existingUser = users.find((u: any) => u.email === googleEmail);

            if (!existingUser) {
              users.push({ email: googleEmail, password: "google_oauth" });
              localStorage.setItem("users", JSON.stringify(users));
            }

            presentToast({
              message: `Welcome ${decoded.name}!`,
              duration: 2000,
              position: "top",
              color: "success",
            });

            router.push("/it35-lab/app");
          });
      }
    },
    onError: () => {
      setAlertMessage("Google Sign-In failed. Please try again.");
      setShowAlert(true);
    },
  });

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
                <img
                  src="https://scontent.fceb8-1.fna.fbcdn.net/v/t1.15752-9/520858659_2057475981322730_7566595731853589810_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=101&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeFuksu5rIMWeIBOpQSZIjR2HYSkklb8iyAdhKSSVvyLIE5OxnXB3wNnDcIRaLnKZBzp_JNyGICV4mxudvTB-Ll0&_nc_ohc=gB5lm7hDNn0Q7kNvwHbL1qn&_nc_oc=AdkRQF7KphJps_oWOc-2dc7Bl0-sgf-JUgNkFsXbHhkQ3X_qqBRstZMQsboBI58zo7k&_nc_ad=z-m&_nc_cid=5917&_nc_zt=23&_nc_ht=scontent.fceb8-1.fna&oh=03_Q7cD2wFxQdiQOeWgBqILAxfFJZ0mjqYFysHskhRfLdJ72EUE6g&oe=68A6ED2C"
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </IonAvatar>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonInput
          label="Email"
          type="email"
          value={email}
          onIonChange={(e) => setEmail(e.detail.value!)}
          placeholder="Enter email"
        />
        <IonInput
          type="password"
          label="Password"
          value={password}
          onIonChange={(e) => setPassword(e.detail.value!)}
          placeholder="Enter password"
        >
          <IonInputPasswordToggle slot="end" />
        </IonInput>

        <IonButton onClick={doLogin} expand="full" style={{ marginTop: '15px' }}>
          Login
        </IonButton>

        <IonText color="medium" style={{ display: "block", marginTop: "10px", textAlign: "center" }}>
          or
        </IonText>

        {/* Google + Facebook Logos Side by Side */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "15px" }}>
          {/* Google Logo */}
          <div
            onClick={() => loginWithGoogle()}
            style={{
              cursor: "pointer",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google Login"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Facebook Logo */}
          <FacebookLogin
            appId="741074022014246"
            autoLoad={false}
            useRedirect={false}
            onSuccess={(response: any) => {
              const fbEmail = response.email || `user_${response.userID}@facebook.com`;
              const fbName = response.name || 'Facebook User';

              const users = JSON.parse(localStorage.getItem("users") || "[]");
              const existingUser = users.find((u: any) => u.email === fbEmail);

              if (!existingUser) {
                users.push({ email: fbEmail, password: "facebook_oauth" });
                localStorage.setItem("users", JSON.stringify(users));
              }

              presentToast({
                message: `Welcome ${fbName}!`,
                duration: 2000,
                position: "top",
                color: "success",
              });

              router.push("/it35-lab/app");
            }}
            onFail={(err) => {
              console.error("Facebook Login Error:", err);
              setAlertMessage("Facebook login failed.");
              setShowAlert(true);
            }}
            scope="public_profile,email"
            fields="name,email"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
              alt="Facebook Login"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </FacebookLogin>
        </div>

        <IonText color="primary" style={{ display: "block", marginTop: "15px", textAlign: "center" }}>
          Don't have an account?{" "}
          <span onClick={goToRegister} style={{ textDecoration: "underline", cursor: "pointer" }}>
            Sign up
          </span>
        </IonText>

        <IonAlert
          isOpen={showAlert}
          message={alertMessage}
          buttons={["OK"]}
          onDidDismiss={() => setShowAlert(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
