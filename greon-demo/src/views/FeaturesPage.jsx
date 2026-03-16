import React from 'react';

const FeaturesPage = () => {
  return (
    <div style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
      <h1>Deep Dive Features</h1>
      <p style={{ fontSize: '18px', color: 'var(--color-text-muted)' }}>
        Explore how our AI Feasibility Engine, Profit Estimation, and Satellite Scanning work.
      </p>
      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div style={{ padding: '32px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          <h3>AI Feasibility</h3>
          <p>We use Gemini to analyze your land coordinates against local weather data.</p>
        </div>
        <div style={{ padding: '32px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          <h3>Profit & ROI Estimation</h3>
          <p>We run models on irradiance and wind to project realistic 5-year returns.</p>
        </div>
        <div style={{ padding: '32px', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
          <h3>Satellite Scanning</h3>
          <p>Use our tools to trace properties and analyze exact square footage remotely.</p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
