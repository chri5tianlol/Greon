import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { Leaf, DollarSign, TrendingUp, Sun, Lock, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('greon_userId');
    fetch(`http://localhost:3001/api/dashboard${userId ? `?userId=${userId}` : ''}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="dashboard loading-center">
        <Loader2 size={48} className="spinner" />
        <p>Loading your sustainability profile...</p>
      </div>
    );
  }

  const user = data?.user || { name: 'Landowner' };
  const metrics = data?.metrics || { sustainabilityScore: 0, totalSolarPotential: 0, estimatedProfit: 0 };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name}</h1>
          <p>Here is the overview of your land's renewable energy potential.</p>
        </div>
        <div className="sustainability-badge">
          <Leaf className="badge-icon" />
          <div className="badge-info">
            <span className="badge-label">Sustainability Score</span>
            <span className="badge-score">{metrics.sustainabilityScore}/100</span>
          </div>
        </div>
      </header>
      
      <section className="dashboard-grid">
        <div className="card stat-card primary-stat">
          <div className="card-header">
            <h3>Solar Potential (Free Tier)</h3>
            <Sun className="card-icon text-accent" />
          </div>
          <div className="card-body">
            <div className="stat-value">{metrics.totalSolarPotential.toFixed(1)} MW</div>
            <p className="stat-desc">Est. Solar Generation / Month</p>
          </div>
          <div className="roi-indicator positive">
            <TrendingUp size={16} />
            <span>+12% vs Regional Avg</span>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="card-header">
            <h3>Estimated Lease Profit</h3>
            <DollarSign className="card-icon" />
          </div>
          <div className="card-body">
            <div className="stat-value">${metrics.estimatedProfit.toLocaleString()}<span className="stat-unit">/mo</span></div>
            <p className="stat-desc">Based on current energy market rates</p>
          </div>
        </div>

        {/* Premium Locked Section */}
        <div className="card premium-locked-card">
          <div className="locked-content">
            <Lock size={32} className="lock-icon" />
            <h3>Hybrid Systems & Land Investments</h3>
            <p>Unlock advanced wind & hybrid forecasting, tax credit analysis, and direct vendor matching.</p>
            <button className="upgrade-btn">Upgrade to Premium</button>
          </div>
          <div className="blurred-background">
            <div className="mock-chart"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
