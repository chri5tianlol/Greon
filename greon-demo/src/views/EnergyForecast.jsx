import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import './EnergyForecast.css';
import { DollarSign, Zap, TrendingUp, Sun, Wind, Loader2 } from 'lucide-react';

const EnergyForecast = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('greon_userId');
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetch(`http://localhost:3001/api/dashboard?userId=${userId}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching forecast data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="energy-forecast view-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={48} className="spinner" />
      </div>
    );
  }

  // Derive dynamic facts
  const recentScans = data?.recentScans || [];
  let monthlyData = [];
  let yearlyData = [];
  let avgAnnualYield = 0;
  let projectedRevenue = 0;
  let roiTimeframe = "5.0";

  if (recentScans.length > 0) {
    // Collect aggregated monthly generation directly from latest scan's reportData
    const aggregatedMonthly = recentScans.reduce((acc, scan) => {
      let report;
      try {
        report = typeof scan.reportData === 'string' ? JSON.parse(scan.reportData) : scan.reportData;
      } catch (e) {
        report = null;
      }
      
      if (report && report.monthlyBreakdown) {
        report.monthlyBreakdown.forEach((m, i) => {
          if (!acc[i]) acc[i] = { month: m.month, generation: 0 };
          acc[i].generation += (m.hybrid || m.solar || m.wind || 0) / 1000; // Convert kWh to MWh
        });
      }
      return acc;
    }, []);

    monthlyData = aggregatedMonthly.length > 0 ? aggregatedMonthly : [
      { month: 'Jan', generation: 0 }, { month: 'Feb', generation: 0 }, { month: 'Mar', generation: 0 },
      { month: 'Apr', generation: 0 }, { month: 'May', generation: 0 }, { month: 'Jun', generation: 0 },
      { month: 'Jul', generation: 0 }, { month: 'Aug', generation: 0 }, { month: 'Sep', generation: 0 },
      { month: 'Oct', generation: 0 }, { month: 'Nov', generation: 0 }, { month: 'Dec', generation: 0 }
    ];

    avgAnnualYield = monthlyData.reduce((acc, m) => acc + m.generation, 0); // Total MWh in a year
    
    // Generate 5-year projection based on real data
    const baseProfit = data?.metrics?.estimatedProfit * 12 || avgAnnualYield * 100 * 12; // Estimation
    projectedRevenue = baseProfit * 5;
    roiTimeframe = (Math.max(2.5, 6 - (recentScans.length * 0.5))).toFixed(1);
    
    const startYear = new Date().getFullYear();
    yearlyData = Array.from({ length: 5 }).map((_, i) => ({
      year: (startYear + i).toString(),
      profit: Math.round(baseProfit * (1 + (i * 0.05))) // Adding simple 5% growth speculatively
    }));
  } else {
    // Fallback Mock Data if no scans
    avgAnnualYield = 12.5 * 1000; // MWh
    projectedRevenue = 238900;
    roiTimeframe = "4.2";
    monthlyData = [
      { month: 'Jan', generation: 0.8 }, { month: 'Feb', generation: 0.9 }, { month: 'Mar', generation: 1.2 },
      { month: 'Apr', generation: 1.5 }, { month: 'May', generation: 1.8 }, { month: 'Jun', generation: 2.1 },
      { month: 'Jul', generation: 2.3 }, { month: 'Aug', generation: 2.1 }, { month: 'Sep', generation: 1.7 },
      { month: 'Oct', generation: 1.3 }, { month: 'Nov', generation: 0.9 }, { month: 'Dec', generation: 0.7 }
    ];
    yearlyData = [
      { year: '2024', profit: 45000 }, { year: '2025', profit: 46200 }, { year: '2026', profit: 47500 },
      { year: '2027', profit: 49000 }, { year: '2028', profit: 51200 },
    ];
  }
  return (
    <div className="energy-forecast view-container">
      <header className="view-header">
        <h1>Energy Forecast & ROI</h1>
        <p>Projected yields and financial returns based on local environmental data.</p>
      </header>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(120, 230, 208, 0.2)' }}>
            <Zap className="text-accent" />
          </div>
          <div className="metric-content">
            <span className="metric-label">Avg. Annual Yield</span>
            <span className="metric-value">{(avgAnnualYield / 1000).toFixed(1)} GWh</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <DollarSign style={{ color: '#10b981' }} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Projected 5yr Revenue</span>
            <span className="metric-value">${projectedRevenue.toLocaleString()}</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: 'rgba(14, 54, 43, 0.1)' }}>
            <TrendingUp className="text-brand" />
          </div>
          <div className="metric-content">
            <span className="metric-label">ROI Timeframe</span>
            <span className="metric-value">{roiTimeframe} Years</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container large">
          <h3>5-Year Financial Projection (Lease Profit)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Profit']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="profit" stroke="#0e362b" strokeWidth={3} dot={{ r: 6, fill: '#78e6d0', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container side">
          <h3>Monthly Generation Curve (MW)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip 
                  cursor={{ fill: 'rgba(120, 230, 208, 0.1)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="generation" fill="#78e6d0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="hardware-comparison">
         <h3>Optimal Hardware Synergy</h3>
         <div className="sys-cards">
            <div className="sys-card recommended">
              <div className="sys-badge">Recommended Mix</div>
              <div className="sys-icon"><Sun size={24}/> <Wind size={24}/></div>
              <h4>70% Solar / 30% Wind</h4>
              <p>Maximizes yield across all seasons, utilizing high summer irradiance and strong winter gusts.</p>
            </div>
            <div className="sys-card">
              <div className="sys-icon"><Sun size={24}/></div>
              <h4>100% Tracking Solar</h4>
              <p>High initial yield but suffers during winter months. 15% lower annual revenue compared to hybrid.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default EnergyForecast;
