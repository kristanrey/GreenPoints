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
import Menu from './pages/Menu';
import Registration from './pages/Register';

setupIonicReact();

const App: React.FC = () => (
  <GoogleOAuthProvider clientId="871717818296-fbp2i05vu79pps91uhfdb50d3s2764km.apps.googleusercontent.com">
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>

          {/* Optional: Redirect '/' to '/GreenPoints' */}
          <Route exact path="/" render={() => <Redirect to="/GreenPoints" />} />

          {/* ✅ Main Routes */}
          <Route exact path="/GreenPoints" component={Landing} />
          <Route path="/GreenPoints/login" component={Login} />
          <Route path="/GreenPoints/register" component={Registration} />
          <Route path="/GreenPoints/app" component={Menu} />

        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </GoogleOAuthProvider>
);

export default App;
