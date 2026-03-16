import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children, activeView, setActiveView, onLogout, user }) => {
  return (
    <div className="dashboard-layout">
      <Navbar isLoggedIn={true} />
      
      <div className="app-container" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} user={user} />
        
        <main className="main-content">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
