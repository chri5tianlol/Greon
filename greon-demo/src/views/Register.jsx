import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { Loader2 } from 'lucide-react';

const Register = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      localStorage.setItem('greon_userId', data.userId);
      onRegister(data.userId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <img src="/greon_logo.png" alt="Greon" style={{ height: '36px', width: 'auto', objectFit: 'contain', margin: '0 auto 24px' }} />
        <h2>Create an Account</h2>
        <p className="subtitle">Sign up to analyze and manage your land's renewable potential.</p>
        
        {error && <div className="error-banner">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password (min 6 characters)" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            minLength={6}
            required 
          />
          <button type="submit" className="action-btn w-full" disabled={loading}>
            {loading ? <Loader2 className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/signin" className="text-btn inline">Log In</Link>
        </p>
      </div>
    </div>
  );
};
export default Register;
