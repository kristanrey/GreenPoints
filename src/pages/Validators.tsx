import React from "react";
import {
  IonPage,
  IonContent,
} from "@ionic/react";

import "./Validators.css";

const AdminDashboard: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        {/* SIDEBAR */}
        <section id="sidebar">
        <a href="#" className="brand">
           <img src="https://scontent.fcgy4-1.fna.fbcdn.net/v/t1.15752-9/522341098_1094714478913591_4251909951679950225_n.png?_nc_cat=105&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeGWIpOxQ_W3lYt9sxtKQdADrb9lzD4spMmtv2XMPiykyU2qRncsDps76OTLE1sDLg4T6KkFROMU_Z2nGj1xCFA3&_nc_ohc=fWPFbGF1V7QQ7kNvwFqHAQa&_nc_oc=AdnMGO0ThicGoG4CsKxFN-Wfe8n99BmgdqdW9GUB2A5tlRMlu0Mw4bfwUuRTqJ0bRHAIIn11k3HGAKmXe-Wgl7YI&_nc_ad=z-m&_nc_cid=5917&_nc_zt=23&_nc_ht=scontent.fcgy4-1.fna&oh=03_Q7cD3QG3oo91ZFj338i-YG5i-Q22dYjqhwFSVBSQhKpG0GINWw&oe=68DE6737" alt="logo" className="brand-logo" />
           <span className="text">GreenPoints</span>
        </a>

          <ul className="side-menu top">
            
            <li>
              <a href="GreenPoints/Leaderboards-Admin">
                <i className="bx bxs-shopping-bag-alt"></i>
                <span className="text">Leaderboards</span>
              </a>
            </li>
            <li>
              <a href="#">
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
                  <li>
                    <a className="active" href="#">Home</a>
                  </li>
                </ul>
              </div>
             
            </div>

            <ul className="box-info">
              <li>
                <i className="bx bxs-calendar-check"></i>
                <span className="text">
                  <h3>1020</h3>
                  <p>Users</p>
                </span>
              </li>
              <li>
                <i className="bx bxs-group"></i>
                <span className="text">
                  <h3>2834</h3>
                  <p>Trees Planted</p>
                </span>
              </li>
              <li>
                <i className="bx bxs-dollar-circle"></i>
                <span className="text">
                  <h3>$2543</h3>
                  <p>Total Sales</p>
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
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Date Order</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <img src="assets/img/people.png" alt="user" />
                        <p>John Doe</p>
                      </td>
                      <td>01-10-2021</td>
                      <td><span className="status completed">Completed</span></td>
                    </tr>
                    <tr>
                      <td>
                        <img src="assets/img/people.png" alt="user" />
                        <p>John Doe</p>
                      </td>
                      <td>01-10-2021</td>
                      <td><span className="status pending">Pending</span></td>
                    </tr>
                    <tr>
                      <td>
                        <img src="assets/img/people.png" alt="user" />
                        <p>John Doe</p>
                      </td>
                      <td>01-10-2021</td>
                      <td><span className="status process">Process</span></td>
                    </tr>
                  </tbody>
                </table>
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
