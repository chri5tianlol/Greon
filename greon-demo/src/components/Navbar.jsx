import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ isLoggedIn }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setMobileOpen(!mobileOpen);
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="navbar-wrapper">
      <nav className="navbar-container">
        <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
          <img src="/greon_logo.png" alt="Greon Logo" className="nav-logo" />
        </Link>
        
        <button className="nav-hamburger" onClick={toggleMenu}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-menu-wrapper ${mobileOpen ? 'mobile-open' : ''}`}>
          <div className="nav-links" onClick={() => setMobileOpen(false)}>
            <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
            <Link to="/features" className={`nav-link ${isActive('/features')}`}>Features</Link>
            <Link to="/community" className={`nav-link ${isActive('/community')}`}>Community Grid</Link>
            <Link to="/pricing" className={`nav-link ${isActive('/pricing')}`}>Pricing</Link>
            <Link to="/partners" className={`nav-link ${isActive('/partners')}`}>Partners</Link>
          </div>
          
          <div className="nav-actions" onClick={() => setMobileOpen(false)}>
            {isLoggedIn ? (
               <Link to="/dashboard" className="btn-signin">Dashboard</Link>
            ) : (
               <Link to="/signin" className="btn-signin">Sign In</Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
