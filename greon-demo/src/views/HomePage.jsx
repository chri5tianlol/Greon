import React from 'react';
import { Link } from 'react-router-dom';
import { Map, Zap, Link as LinkIcon, Play, ShieldCheck, DollarSign } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Unlock the <span>Hidden Value</span> of Your Land</h1>
          <p className="hero-subtitle">
            Greon leverages AI and satellite data to instantly assess your property’s renewable energy potential, projecting ROI and connecting you to a local virtual grid.
          </p>
          <div className="hero-actions">
            <Link to="/signin" className="btn-primary">
              <Map size={20} /> Scan Your Land Free
            </Link>
            <a href="#demo" className="btn-secondary">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="video-section" id="demo">
        <div className="video-container">
          <div className="video-placeholder">
            <div className="play-icon">
              <Play size={32} color="var(--color-brand-primary)" style={{ marginLeft: '4px' }} />
            </div>
            <h2>Watch the 48-Hour Demo</h2>
            <p>See how a landowner verified, scanned, and connected their property in under 48 hours.</p>
          </div>
        </div>
      </section>

      <section className="values-section">
        <h2 className="section-title">Why Choose Greon?</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon"><Zap size={24} /></div>
            <h3>Instant AI Feasibility</h3>
            <p>We analyze coordinates, irradiance, and wind speeds to recommend the exact hardware your land needs.</p>
          </div>
          <div className="value-card">
            <div className="value-icon"><DollarSign size={24} /></div>
            <h3>Accurate ROI Forecasting</h3>
            <p>Get a realistic 5-year lease profit projection before you ever speak to an installer.</p>
          </div>
          <div className="value-card">
            <div className="value-icon"><LinkIcon size={24} /></div>
            <h3>Community Integration</h3>
            <p>Merge your land with neighbors to form a Virtual Power Plant, commanding institutional-grade energy rates.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
