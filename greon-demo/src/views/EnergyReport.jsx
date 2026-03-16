import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sun, Wind, Zap, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import './EnergyReport.css';

const EnergyReport = ({ reportData, scanResult, onBack }) => {
  if (!reportData) return null;

  const { dailyAverages, bestMonth, worstMonth, monthlyBreakdown } = reportData;

  return (
    <div className="energy-report slide-in">
      <div className="report-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Analysis
        </button>
        <h2>Full Energy Report</h2>
        <p className="report-subtitle">
          12-month forecast for <strong>{scanResult?.address || 'your property'}</strong>
        </p>
      </div>

      {/* Daily Averages */}
      <div className="averages-grid">
        <div className="avg-card solar-card">
          <div className="avg-icon"><Sun size={28} /></div>
          <div className="avg-body">
            <span className="avg-label">Solar (Daily Avg)</span>
            <span className="avg-value">{dailyAverages?.solar_kWh?.toLocaleString() || 0} <small>kWh</small></span>
          </div>
        </div>
        <div className="avg-card wind-card">
          <div className="avg-icon"><Wind size={28} /></div>
          <div className="avg-body">
            <span className="avg-label">Wind (Daily Avg)</span>
            <span className="avg-value">{dailyAverages?.wind_kWh?.toLocaleString() || 0} <small>kWh</small></span>
          </div>
        </div>
        <div className="avg-card hybrid-card">
          <div className="avg-icon"><Zap size={28} /></div>
          <div className="avg-body">
            <span className="avg-label">Hybrid (Daily Avg)</span>
            <span className="avg-value">{dailyAverages?.hybrid_kWh?.toLocaleString() || 0} <small>kWh</small></span>
          </div>
        </div>
      </div>

      {/* Best & Worst Month */}
      <div className="extremes-grid">
        <div className="extreme-card best">
          <div className="extreme-header"><TrendingUp size={20} /> Peak Production Months</div>
          <div className="extreme-rows">
            <div className="extreme-row">
              <Sun size={16} /> <span>Solar:</span> <strong>{bestMonth?.solar?.month}</strong> — {bestMonth?.solar?.kWh?.toLocaleString()} kWh
            </div>
            <div className="extreme-row">
              <Wind size={16} /> <span>Wind:</span> <strong>{bestMonth?.wind?.month}</strong> — {bestMonth?.wind?.kWh?.toLocaleString()} kWh
            </div>
            <div className="extreme-row">
              <Zap size={16} /> <span>Hybrid:</span> <strong>{bestMonth?.hybrid?.month}</strong> — {bestMonth?.hybrid?.kWh?.toLocaleString()} kWh
            </div>
          </div>
        </div>
        <div className="extreme-card worst">
          <div className="extreme-header"><TrendingDown size={20} /> Lowest Production Months</div>
          <div className="extreme-rows">
            <div className="extreme-row">
              <Sun size={16} /> <span>Solar:</span> <strong>{worstMonth?.solar?.month}</strong> — {worstMonth?.solar?.kWh?.toLocaleString()} kWh
            </div>
            <div className="extreme-row">
              <Wind size={16} /> <span>Wind:</span> <strong>{worstMonth?.wind?.month}</strong> — {worstMonth?.wind?.kWh?.toLocaleString()} kWh
            </div>
            <div className="extreme-row">
              <Zap size={16} /> <span>Hybrid:</span> <strong>{worstMonth?.hybrid?.month}</strong> — {worstMonth?.hybrid?.kWh?.toLocaleString()} kWh
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Graph */}
      <div className="chart-container">
        <h3>Monthly Energy Production Forecast (kWh)</h3>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={monthlyBreakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradWind" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradHybrid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#78e6d0" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#78e6d0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
              formatter={(value) => [`${value.toLocaleString()} kWh`]}
            />
            <Legend verticalAlign="top" height={36} />
            <Area type="monotone" dataKey="solar" name="☀️ Solar" stroke="#f59e0b" strokeWidth={2} fill="url(#gradSolar)" />
            <Area type="monotone" dataKey="wind" name="💨 Wind" stroke="#3b82f6" strokeWidth={2} fill="url(#gradWind)" />
            <Area type="monotone" dataKey="hybrid" name="⚡ Hybrid" stroke="#0e362b" strokeWidth={2} fill="url(#gradHybrid)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnergyReport;
