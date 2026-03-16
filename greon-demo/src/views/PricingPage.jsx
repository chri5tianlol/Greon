import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Free Plan',
    price: '$0',
    period: '/forever',
    description: 'Perfect for individual landowners exploring their options.',
    features: [
      { text: '1 Property Scan', included: true },
      { text: 'Solar Feasibility Only', included: true },
      { text: 'Basic ROI Estimate', included: true },
      { text: 'Community Grid Access', included: true },
      { text: 'Wind & Hybrid Analysis', included: false },
      { text: 'Tax Credit Forecasting', included: false },
      { text: 'Priority Support', included: false },
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Premium Plan',
    price: '$29',
    period: '/month',
    description: 'For serious investors and multi-property portfolios.',
    features: [
      { text: 'Up to 3 Property Scans', included: true },
      { text: 'Solar, Wind & Hybrid Analysis', included: true },
      { text: 'Advanced ROI & Tax Credits', included: true },
      { text: 'Community Grid + VPP Access', included: true },
      { text: 'Direct Vendor Matching', included: true },
      { text: 'Investment Portfolio Tools', included: true },
      { text: 'Priority Support', included: true },
    ],
    cta: 'Start Premium Trial',
    highlight: true,
  },
];

const PricingPage = () => {
  return (
    <div style={{ padding: '80px 40px', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1>Simple, Transparent Pricing</h1>
        <p style={{ fontSize: '18px', color: 'var(--color-text-muted)' }}>Choose the plan that matches your ambitions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            padding: '40px 32px',
            borderRadius: '20px',
            border: plan.highlight ? '2px solid var(--color-brand-primary)' : '1px solid var(--color-border)',
            background: plan.highlight ? 'var(--color-bg-secondary)' : '#fff',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {plan.highlight && (
              <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-brand-primary)', color: '#fff', padding: '4px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
                Most Popular
              </span>
            )}
            <h2 style={{ marginBottom: '4px' }}>{plan.name}</h2>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-brand-primary)' }}>{plan.price}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{plan.period}</span>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '24px' }}>{plan.description}</p>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: f.included ? 'var(--color-text-main)' : 'var(--color-text-muted)', opacity: f.included ? 1 : 0.5 }}>
                  {f.included ? <Check size={16} color="#10b981" /> : <X size={16} />}
                  {f.text}
                </div>
              ))}
            </div>

            <Link to="/signin" style={{
              display: 'block',
              textAlign: 'center',
              padding: '14px',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
              background: plan.highlight ? 'var(--color-brand-primary)' : '#fff',
              color: plan.highlight ? '#fff' : 'var(--color-brand-primary)',
              border: plan.highlight ? 'none' : '1px solid var(--color-border)',
              transition: 'all 0.2s',
            }}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
