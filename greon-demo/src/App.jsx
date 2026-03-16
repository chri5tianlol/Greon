import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Layouts
import PublicLayout from './views/PublicLayout';
import DashboardLayout from './views/DashboardLayout';

// Public Pages
import HomePage from './views/HomePage';
import FeaturesPage from './views/FeaturesPage';
import CommunityPage from './views/CommunityPage';
import PricingPage from './views/PricingPage';
import PartnersPage from './views/PartnersPage';

// Auth
import Login from './views/Login';
import Register from './views/Register';

// Dashboard Views
import Dashboard from './views/Dashboard';
import LandScanner from './views/LandScanner';
import EnergyForecast from './views/EnergyForecast';
import CommunityGrid from './views/CommunityGrid';
import Onboarding from './views/Onboarding';

// Admin
import AdminPanel from './views/AdminPanel';

import './App.css';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('greon_userId') || null);
  const [activeView, setActiveView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [hasProperties, setHasProperties] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('greon_userId');
    setUserId(null);
    setHasProperties(null);
    setUser(null);
  };

  useEffect(() => {
    if (!userId) return;
    
    fetch(`http://localhost:3001/api/dashboard?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setHasProperties(data.user.properties && data.user.properties.length > 0);
        }
      })
      .catch(() => {
        setHasProperties(false);
      });
  }, [userId]);

  const isLoggedIn = !!userId;

  const renderDashboardContent = () => {
    // Still loading user data
    if (hasProperties === null) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 className="spinner" size={48} color="var(--color-brand-primary)" />
        </div>
      );
    }

    // Needs onboarding
    if (hasProperties === false) {
      return <Onboarding onComplete={() => setHasProperties(true)} />;
    }

    // Render active view
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'scanner': return <LandScanner user={user} onAddLand={() => setHasProperties(false)} />;
      case 'forecast': return <EnergyForecast />;
      case 'community': return <CommunityGrid />;
      case 'premium':
        return (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Premium Features Locked</h2>
            <p>Upgrade to access direct PPA negotiation and tax credit forecasting.</p>
          </div>
        );
      default: return <Dashboard />;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<PublicLayout isLoggedIn={isLoggedIn}><HomePage /></PublicLayout>} />
        <Route path="/features" element={<PublicLayout isLoggedIn={isLoggedIn}><FeaturesPage /></PublicLayout>} />
        <Route path="/community" element={<PublicLayout isLoggedIn={isLoggedIn}><CommunityPage /></PublicLayout>} />
        <Route path="/pricing" element={<PublicLayout isLoggedIn={isLoggedIn}><PricingPage /></PublicLayout>} />
        <Route path="/partners" element={<PublicLayout isLoggedIn={isLoggedIn}><PartnersPage /></PublicLayout>} />

        {/* Auth Pages */}
        <Route path="/signin" element={
          isLoggedIn ? <Navigate to="/dashboard" /> : (
            <PublicLayout isLoggedIn={false}>
              <Login onLogin={setUserId} />
            </PublicLayout>
          )
        } />
        <Route path="/register" element={
          isLoggedIn ? <Navigate to="/dashboard" /> : (
            <PublicLayout isLoggedIn={false}>
              <Register onRegister={setUserId} />
            </PublicLayout>
          )
        } />

        {/* Dashboard (Protected) */}
        <Route path="/dashboard" element={
          !isLoggedIn ? <Navigate to="/signin" /> : (
            <DashboardLayout
              activeView={activeView}
              setActiveView={setActiveView}
              onLogout={handleLogout}
              user={user}
            >
              {renderDashboardContent()}
            </DashboardLayout>
          )
        } />

        {/* Admin (Protected, Separate) */}
        <Route path="/admin" element={
          !isLoggedIn ? <Navigate to="/signin" /> : (
            <PublicLayout isLoggedIn={true}>
              <AdminPanel user={user} />
            </PublicLayout>
          )
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
