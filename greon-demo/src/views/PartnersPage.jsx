import React from 'react';
import { Handshake, BarChart3, Users } from 'lucide-react';

const PartnersPage = () => {
  return (
    <div style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1>Become a Greon Partner</h1>
        <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Whether you're a solar installer, energy consultant, or real estate agency — earn commissions by connecting landowners with the right solutions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '60px' }}>
        <div style={{ padding: '40px 32px', background: 'var(--color-bg-secondary)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
          <Handshake size={32} color="var(--color-brand-primary)" style={{ marginBottom: '16px' }} />
          <h3>Vendor Portal</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>List your services and get matched with pre-qualified landowners who have verified renewable energy potential on their property.</p>
        </div>
        <div style={{ padding: '40px 32px', background: 'var(--color-bg-secondary)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
          <BarChart3 size={32} color="var(--color-brand-primary)" style={{ marginBottom: '16px' }} />
          <h3>Commission Structure</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Earn 5–12% on every successful installation referral. Premium partners unlock higher tiers through volume-based incentives.</p>
        </div>
        <div style={{ padding: '40px 32px', background: 'var(--color-bg-secondary)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
          <Users size={32} color="var(--color-brand-primary)" style={{ marginBottom: '16px' }} />
          <h3>Agency Program</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Real estate agencies can white-label our land assessment reports and offer energy audits as a value-added service to clients.</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '60px', background: 'var(--color-bg-secondary)', borderRadius: '24px' }}>
        <h2>Ready to Partner?</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Contact our partnerships team to get started.</p>
        <a href="mailto:partners@greon.demo" style={{
          display: 'inline-block',
          padding: '14px 32px',
          background: 'var(--color-brand-primary)',
          color: '#fff',
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '15px',
          textDecoration: 'none',
        }}>Contact Us</a>
      </div>
    </div>
  );
};

export default PartnersPage;
