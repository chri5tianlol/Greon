import React from 'react';
import { Link } from 'react-router-dom';

const CommunityPage = () => {
  return (
    <div style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto', minHeight: '60vh' }}>
      <h1>The Community Virtual Grid</h1>
      <div style={{ background: 'var(--color-bg-secondary)', padding: '60px', borderRadius: '24px', textAlign: 'center', marginTop: '40px' }}>
        <h2 style={{ fontSize: '32px' }}>Power is Better Together</h2>
        <p style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
          Learn how to merge your property with local neighbors to form high-capacity energy blocks.
        </p>
        <Link to="/signin" className="btn-primary" style={{ background: 'var(--color-brand-primary)', color: '#fff', padding: '14px 32px', borderRadius: '999px', textDecoration: 'none', display: 'inline-block' }}>
          Join the Grid
        </Link>
      </div>
    </div>
  );
};

export default CommunityPage;
