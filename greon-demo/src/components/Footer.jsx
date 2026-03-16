import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/greon_logo.png" alt="Greon" className="nav-logo" />
          <p>Unlocking the full potential of your land with AI feasibility and smart energy network connections.</p>
        </div>
        
        <div className="footer-section">
          <h4>Platform</h4>
          <div className="footer-links">
            <Link to="/features">Product Features</Link>
            <Link to="/pricing">Pricing Plans</Link>
            <Link to="/community">Virtual Grid</Link>
          </div>
        </div>

        <div className="footer-section">
          <h4>Company</h4>
          <div className="footer-links">
            <Link to="/partners">Partner Program</Link>
            <a href="#">About Us</a>
            <a href="#">Contact Support</a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Legal</h4>
          <div className="footer-links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Guidelines</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Greon Demo Project. AI Land Potential.</span>
        <span>Made for demonstration purposes.</span>
      </div>
    </footer>
  );
};

export default Footer;
