// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import { IonPage, IonContent } from "@ionic/react";
import { supabase } from "../utils/supabaseClient"; // adjust path if needed
import "./Validators.css";

interface Activity {
  id: number;
  user_id: string;
  created_at: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
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

      // ✅ Fetch total trees planted (sum from profiles)
      const { data: treesData, error: treesError } = await supabase
        .from("profiles")
        .select("trees_planted");

      if (treesError) throw treesError;

      const totalTrees = treesData?.reduce(
        (acc: number, row: any) => acc + (row.trees_planted || 0),
        0
      );

      setTreesPlanted(totalTrees || 0);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err.message);
    }

    setLoading(false);
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* SIDEBAR */}
        <section id="sidebar">
          <a href="#" className="brand">
            <img
              src="https://scontent.fcgy4-1.fna.fbcdn.net/v/t1.15752-9/522341098_1094714478913591_4251909951679950225_n.png?_nc_cat=105&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeGWIpOxQ_W3lYt9sxtKQdADrb9lzD4spMmtv2XMPiykyU2qRncsDps76OTLE1sDLg4T6KkFROMU_Z2nGj1xCFA3&_nc_ohc=fWPFbGF1V7QQ7kNvwFqHAQa&_nc_oc=AdnMGO0ThicGoG4CsKxFN-Wfe8n99BmgdqdW9GUB2A5tlRMlu0Mw4bfwUuRTqJ0bRHAIIn11k3HGAKmXe-Wgl7YI&_nc_ad=z-m&_nc_cid=5917&_nc_zt=23&_nc_ht=scontent.fcgy4-1.fna&oh=03_Q7cD3QG3oo91ZFj338i-YG5i-Q22dYjqhwFSVBSQhKpG0GINWw&oe=68DE6737"
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
              <a href="http://localhost:8100/GreenPoints/Validate">
                <i className="bx bxs-doughnut-chart"></i>
                <span className="text">Validation</span>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="bx bxs-message-dots"></i>
                <span className="text">Feedback</span>
              </a>
            </li>
            <li>
              <a href="#">
                <i className="bx bxs-group"></i>
                <span className="text">News</span>
              </a>
            </li>
          </ul>

          <ul className="side-menu">
            <li>
              <a href="#">
                <i className="bx bxs-cog"></i>
                <span className="text">Logs</span>
              </a>
            </li>
            <li>
              <a href="#" className="logout">
                <i className="bx bxs-log-out-circle"></i>
                <span className="text">Logout</span>
              </a>
            </li>
          </ul>
        </section>

        {/* CONTENT */}
        <section id="content">
          {/* NAVBAR */}
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

          {/* MAIN */}
          <main>
            <div className="head-title">
              <div className="left">
                <h1>Dashboard</h1>
                <ul className="breadcrumb">
                  <li><i className="bx bx-chevron-right"></i></li>
                  <li><a className="active" href="#">Home</a></li>
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
                          <td>{new Date(activity.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`status ${activity.status.toLowerCase()}`}>
                              {activity.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="todo">
                <div className="head">
                  <h3>Todos</h3>
                  <i className="bx bx-plus"></i>
                  <i className="bx bx-filter"></i>
                </div>
                <ul className="todo-list">
                  <li className="completed">
                    <p>Todo List</p>
                    <i className="bx bx-dots-vertical-rounded"></i>
                  </li>
                  <li className="not-completed">
                    <p>Todo List</p>
                    <i className="bx bx-dots-vertical-rounded"></i>
                  </li>
                </ul>
              </div>
            </div>
          </main>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
  