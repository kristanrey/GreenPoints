// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { IonPage, IonContent } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./css/Validators.css";

interface Activity {
  id: number;
  user_id: string;
  created_at: string;
  status: string;
}

interface Validator {
  id: string;
  full_name: string;
  latitude: number;
  longitude: number;
}

const Validators: React.FC = () => {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState<number>(0);
  const [treesPlanted, setTreesPlanted] = useState<number>(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // ✅ Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from("tree_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (activityError) throw activityError;
      setRecentActivity(activityData as Activity[]);

      // ✅ Fetch number of users
      const { count: profileCount, error: profileError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (profileError) throw profileError;
      setUserCount(profileCount || 0);

      // ✅ Fetch total trees planted
      const { data: treesData, error: treesError } = await supabase
        .from("profiles")
        .select("trees_planted");

      if (treesError) throw treesError;

      const totalTrees = treesData?.reduce(
        (acc: number, row: any) => acc + (row.trees_planted || 0),
        0
      );
      setTreesPlanted(totalTrees || 0);

      // ✅ Fetch validator locations
      const { data: validatorData, error: validatorError } = await supabase
        .from("profiles")
        .select("id, full_name, latitude, longitude")
        .eq("role", "validator"); // only fetch validators

      if (validatorError) throw validatorError;

      setValidators(validatorData as Validator[]);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err.message);
    }
    setLoading(false);
  };

  // Default marker icon fix for Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* SIDEBAR */}
        <section id="sidebar">
          <a href="#" className="brand">
            <img
              src="https://scontent.fdvo6-1.fna.fbcdn.net/v/t1.15752-9/522341098_1094714478913591_4251909951679950225_n.png?_nc_cat=105&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeGWIpOxQ_W3lYt9sxtKQdADrb9lzD4spMmtv2XMPiykyU2qRncsDps76OTLE1sDLg4T6KkFROMU_Z2nGj1xCFA3&_nc_ohc=n8rjiasNt2YQ7kNvwET0GLB&_nc_oc=AdmfWnvjhWTMrUHQDGfZhpjpUHl7p05AY-QAcesVJYR-OnX9KCPpsUMB9pn-5qZ4Fhs&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fdvo6-1.fna&oh=03_Q7cD3gG2upQFKDLXfwHThg7qckMiMjAQXAleF2FD2dMEJVYCcQ&oe=691D0677"
              alt="logo"
              className="brand-logo"
            />
            <span className="text">GreenPoints</span>
          </a>

          <ul className="side-menu top">
            <li>
              <a href="GreenPoints/leaderboard">
                <i className="bx bxs-shopping-bag-alt"></i>
                <span className="text">Leaderboards</span>
              </a>
            </li>
            <li>
              <a href="https://kristanrey.github.io/GreenPoints//Validate">
                <i className="bx bxs-doughnut-chart"></i>
                <span className="text">Validation</span>
              </a>
            </li>
            <li>
              <a href="http://localhost:8100/GreenPoints/FeedbackAdmin">
                <i className="bx bxs-message-dots"></i>
                <span className="text">Feedback</span>
              </a>
            </li>
            <li>
              <a href="http://localhost:8100/GreenPoints/News">
                <i className="bx bxs-group"></i>
                <span className="text">News</span>
              </a>
            </li>
          </ul>

          <ul className="side-menu">
            <li>
              <a href="http://localhost:8100/GreenPoints/logs">
                <i className="bx bxs-cog"></i>
                <span className="text">Logs</span>
              </a>
            </li>
            <li>
               <a href="http://localhost:8100/GreenPoints/event">
                <i className="bx bxs-cog"></i>
                <span className="text">Events</span>
              </a>
            </li>
             <li>
               <a href="http://localhost:8100/GreenPoints/createrew">
                <i className="bx bxs-cog"></i>
                <span className="text">Rewards</span>
              </a>
            </li>
            <li>
              <li>
  <a href="http://localhost:8100/GreenPoints/statistics">
    <i className="bx bxs-bar-chart-alt-2"></i>
    <span className="text">Statistics</span>
  </a>
</li>

              <a href="#" className="logout">
                <i className="bx bxs-log-out-circle"></i>
                <span className="text">Logout</span>
              </a>
            </li>
          </ul>
        </section>

        {/* CONTENT */}
        <section id="content">
          <nav>
            <i className="bx bx-menu"></i>
            <form action="#">
              <div className="form-input">
                <input type="search" placeholder="Search..." />
                <button type="submit" className="search-btn">
                  <i className="bx bx-search"></i>
                </button>
              </div>
            </form>

            <input type="checkbox" id="switch-mode" hidden />
            <label htmlFor="switch-mode" className="switch-mode"></label>
            <a href="#" className="notification">
              <i className="bx bxs-bell"></i>
              <span className="num">8</span>
            </a>
          </nav>

          <main>
            <div className="head-title">
              <div className="left">
                <h1>Dashboard</h1>
                <ul className="breadcrumb">
                  <li>
                    <i className="bx bx-chevron-right"></i>
                  </li>
                  <li>
                    <a className="active" href="#">
                      Home
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <ul className="box-info">
              <li>
                <i className="bx bxs-calendar-check"></i>
                <span className="text">
                  <h3>{userCount}</h3>
                  <p>Users</p>
                </span>
              </li>
              <li>
                <i className="bx bxs-group"></i>
                <span className="text">
                  <h3>{treesPlanted}</h3>
                  <p>Trees Planted</p>
                </span>
              </li>
            </ul>

            <div className="table-data">
              <div className="order">
                <div className="head">
                  <h3>Recent Activity</h3>
                  <i className="bx bx-search"></i>
                  <i className="bx bx-filter"></i>
                </div>

                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Date Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((activity) => (
                        <tr key={activity.id}>
                          <td>{activity.user_id}</td>
                          <td>
                            {new Date(activity.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`status ${activity.status.toLowerCase()}`}
                            >
                              {activity.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* VALIDATORS MAP */}
             
            </div>
          </main>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default Validators;
