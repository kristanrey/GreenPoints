  // src/App.tsx
  import { Route, Redirect } from 'react-router-dom';
  import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
  import { IonReactRouter } from '@ionic/react-router';
  import { GoogleOAuthProvider } from '@react-oauth/google';

  import '@ionic/react/css/core.css';
  import '@ionic/react/css/normalize.css';
  import '@ionic/react/css/structure.css';
  import '@ionic/react/css/typography.css';
  import '@ionic/react/css/padding.css';
  import '@ionic/react/css/float-elements.css';
  import '@ionic/react/css/text-alignment.css';
  import '@ionic/react/css/text-transformation.css';
  import '@ionic/react/css/flex-utils.css';
  import '@ionic/react/css/display.css';

  import './theme/variables.css';

  // ✅ Import your pages
  import Landing from './pages/Landing';
  import Login from './pages/Login';
  import Registration from './pages/Register';
  import UserDashboard from './pages/UserDashboard';
  import SubmitTree from './pages/SubmitTree';
  import Leaderboard from './pages/Leaderboard';
  import SetUsername from './pages/SetUsername';
  import OAuthCallback from './pages/OAuthCallback';
  import Validators from "./pages/Validators";
  import LeaderboardsAdmin from "./pages/LeaderboardsAdmin";

  setupIonicReact();

  const App: React.FC = () => (
    <GoogleOAuthProvider clientId="871717818296-fbp2i05vu79pps91uhfdb50d3s2764km.apps.googleusercontent.com">
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            {/* Redirect '/' to '/GreenPoints' */}
            <Route exact path="/" render={() => <Redirect to="/GreenPoints" />} />

            {/* ✅ Main Routes */}
            <Route exact path="/GreenPoints" component={Landing} />
            <Route exact path="/GreenPoints/login" component={Login} />
            <Route exact path="/GreenPoints/user-dashboard" component={UserDashboard} />
            <Route exact path="/GreenPoints/register" component={Registration} />
            <Route exact path="/GreenPoints/submit-tree" component={SubmitTree} />
            <Route exact path="/GreenPoints/leaderboard" component={Leaderboard} />
            <Route exact path="/GreenPoints/set-username" component={SetUsername} />
            <Route exact path="/GreenPoints/oauth-callback" component={OAuthCallback} />
            <Route exact path="/GreenPoints/validators" component={Validators} />
            <Route exact path="/GreenPoints/leaderboardsadmin" component={LeaderboardsAdmin} />
            
          
          
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </GoogleOAuthProvider>
  );

  export default App;
