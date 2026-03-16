import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, Zap, Users, ArrowUpCircle, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeView, setActiveView, onLogout, user }) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'My Lands', icon: Map },
    { id: 'forecast', label: 'Energy Forecast & ROI', icon: Zap },
    { id: 'community', label: 'Community Grid', icon: Users },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/greon_logo.png" alt="Greon" className="sidebar-logo" />
        <p className="brand-tagline">Land Potential AI</p>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon className="nav-icon" size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="sidebar-footer">
        <button className="premium-btn" onClick={() => setActiveView('premium')} style={{marginBottom: '10px'}}>
          <ArrowUpCircle className="nav-icon" size={20} />
          <span>Upgrade to Premium</span>
        </button>
        <button className="nav-item" onClick={() => { onLogout(); navigate('/'); }} style={{width: '100%', justifyContent: 'center', backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)'}}>
          <LogOut className="nav-icon" size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
