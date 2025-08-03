// src/pages/Login.tsx
import './login.css';

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

    localStorage.setItem("currentUser", JSON.stringify({
      name: email,
      email: email,
      treesPlanted: 0,
      greenpoints: 0,
    }));

    presentToast({
      message: "Login Success!",
      duration: 2000,
      position: "top",
      color: "success",
    });

    router.push("/GreenPoints/user-dashboard");
  };

  const goToRegister = () => {
    router.push("/GreenPoints/register");
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
            const googleName = decoded.name;
            const users = JSON.parse(localStorage.getItem("users") || "[]");
            const existingUser = users.find((u: any) => u.email === googleEmail);

            if (!existingUser) {
              users.push({ email: googleEmail, password: "google_oauth" });
              localStorage.setItem("users", JSON.stringify(users));
            }

            // ✅ Store OAuth user as current user
            localStorage.setItem("currentUser", JSON.stringify({
              name: googleName,
              email: googleEmail,
              treesPlanted: 0,
              greenpoints: 0,
            }));

            presentToast({
              message: `Welcome ${googleName}!`,
              duration: 2000,
              position: "top",
              color: "success",
            });

            router.push("/GreenPoints/user-dashboard");
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

      <IonContent fullscreen>
        <div className="login-background">
          <IonGrid style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <IonRow>
              <IonCol className="ion-text-center">
                <IonAvatar style={{ width: "100px", height: "100px", margin: "auto" }}>
                  <img
                    src="https://marketplace.canva.com/ARZ8E/MAFmAUARZ8E/1/tl/canva-natural-leaf-icon.-100%25-naturals-vector-image-MAFmAUARZ8E.png"
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </IonAvatar>
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonInput
            className="custom-input"
            label="Email"
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
            placeholder="Enter email"
          />
          <IonInput
            className="custom-input"
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

          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "15px" }}>
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

                // ✅ Store Facebook OAuth user
                localStorage.setItem("currentUser", JSON.stringify({
                  name: fbName,
                  email: fbEmail,
                  treesPlanted: 0,
                  greenpoints: 0,
                }));

                presentToast({
                  message: `Welcome ${fbName}!`,
                  duration: 2000,
                  position: "top",
                  color: "success",
                });

                router.push("/GreenPoints/user-dashboard");
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
