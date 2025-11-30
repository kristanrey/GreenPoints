// src/App.tsx
import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabButton, setupIonicReact } from '@ionic/react';
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
import SetUsername from './pages/SetUsername';
import OAuthCallback from './pages/OAuthCallback';
import Validators from './pages/Validators';
import Admin from './pages/Admin';
import Validate from './pages/Validate';
import Profile from "./pages/EditProfile";
import Leaderboard from './pages/Leaderboard';
import EditProfile from './pages/EditProfile';
import Feedback from './pages/Feedback';
import FeedbackAdmin from './pages/FeedbackAdmin';
import MonitorStatus from './pages/MonitorStatus';
import ValidatorsLogin from './pages/ValidatorsLogin';
import Rewards from './pages/Rewards';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Streak from './pages/Streak';
import Logs from './pages/Logs';
import AdminManage from './pages/AdminManage';
import Fetch from './pages/Fetch';
import Event from './pages/Event';
import UserEvent from './pages/UserEvent';
import EventDetails from "./pages/EventDetails";
import Participate from "./pages/Participate";
import TreeMonitor from "./pages/TreeMonitor";
import RadarPage from "./pages/RadarPage";
import TakePicture from "./pages/TakePicture";
import Input from "./pages/Input";
import CreateRew from "./pages/CreateRew";
import UpdateReward from "./pages/UpdateReward";
import Statistics from "./pages/Statistics";
import Appointment from './pages/Appointment';
import Approval from './pages/Approval';
import AdminValidateEvent from './pages/AdminValidateEvent';
import EventDashboard from './pages/EventDashboard';
import DataCharts from './pages/DataCharts';
import UserLogs from './pages/UserLogs';
import QuickMonitor from './pages/QuickMonitor';
import TreeGallery from './pages/TreeGallery';
















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
          <Route exact path="/GreenPoints/userdashboard" component={UserDashboard} />
          <Route exact path="/GreenPoints/register" component={Registration} />
          <Route exact path="/GreenPoints/submittree" component={SubmitTree} />
          <Route exact path="/GreenPoints/set-username" component={SetUsername} />
          <Route exact path="/GreenPoints/oauth-callback" component={OAuthCallback} />
          <Route exact path="/GreenPoints/validators" component={Validators} />
          <Route exact path="/GreenPoints/admin" component={Admin} />
          <Route exact path="/GreenPoints/validate" component={Validate} />
          <Route exact path="/GreenPoints/leaderboard" component={Leaderboard} />
          <Route path="/GreenPoints/editprofile" component={EditProfile} />
          <Route path="/GreenPoints/feedback" component={Feedback} exact />
          <Route exact path="/GreenPoints/feedbackadmin" component={FeedbackAdmin} />
          <Route exact path="/GreenPoints/monitorstatus" component={MonitorStatus} />
          <Route path="/GreenPoints/validatorslogin" component={ValidatorsLogin} exact />
          <Route path="/GreenPoints/rewards" component={Rewards} exact />
          <Route path="/GreenPoints/news" component={News} exact />
          <Route path="/GreenPoints/news/:id" component={NewsDetail} exact />
          <Route path="/GreenPoints/streak" component={Streak} exact />
            <Route path="/GreenPoints/logs" component={Logs} exact />
             <Route path="/GreenPoints/adminmanage" component={AdminManage} exact />
               <Route path="/GreenPoints/fetch" component={Fetch} exact />
                   <Route path="/GreenPoints/event" component={Event} exact />
                   <Route path="/GreenPoints/userevent" component={UserEvent} exact />
                   <Route path="/GreenPoints/events/:id" component={EventDetails} exact />
                   <Route path="/GreenPoints/participate" component={Participate} exact />
                    <Route path="/GreenPoints/treemonitor" component={TreeMonitor} exact />
                    <Route path="/radar/:id" component={RadarPage} exact />
                     <Route path="/take-picture/:submission_id" component={TakePicture} exact />
                      <Route path="/GreenPoints/input"  component={Input} exact />
                       <Route path="/GreenPoints/createrew"  component={CreateRew} exact />
                       <Route path="/update-reward/:id" component={UpdateReward} exact />
                       <Route path="/GreenPoints/statistics" component={Statistics} exact />
                        <Route path="/GreenPoints/appointment" component={Appointment} exact />
                         <Route path="/GreenPoints/approval" component={Approval} exact />
                         <Route path="/GreenPoints/adminvalidateevent" component={AdminValidateEvent} exact />
                         <Route path="/GreenPoints/eventdashboard" component={EventDashboard} exact />
                         <Route path="/GreenPoints/datacharts" component={DataCharts} exact />
                         <Route path="/GreenPoints/userlogs" component={UserLogs} exact />
                         <Route path="/GreenPoints/quickmonitor" component={QuickMonitor} exact />
                          <Route path="/GreenPoints/treegallery" component={TreeGallery} exact />
                        
                       
                      





                      
                     
                     


            
          

           
            
          



        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </GoogleOAuthProvider>
);

export default App;