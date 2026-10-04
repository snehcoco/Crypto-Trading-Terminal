import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO_EMAIL = 'demo@cryptoterminal.io';
const DEMO_PASSWORD = 'demo1234';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoTyping, setDemoTyping] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 👋');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const typeValue = (setter, value, delay = 0) =>
    new Promise((resolve) => {
      let i = 0;
      setTimeout(() => {
        const interval = setInterval(() => {
          i++;
          setter(value.slice(0, i));
          if (i >= value.length) { clearInterval(interval); resolve(); }
        }, 38);
      }, delay);
    });

  const handleDemoLogin = async () => {
    if (demoTyping || loading) return;
    setError('');
    setDemoTyping(true);
    setEmail('');
    setPassword('');
    await typeValue(setEmail, DEMO_EMAIL);
    await typeValue(setPassword, DEMO_PASSWORD, 120);
    setDemoTyping(false);
    setTimeout(async () => {
      setLoading(true);
      try {
        await login(DEMO_EMAIL, DEMO_PASSWORD);
        toast.success('Demo mode — welcome! 🚀');
      } catch {
        toast.error('Demo account not found. Register it first or check your backend.');
      } finally {
        setLoading(false);
      }
    }, 450);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">₿</div>
        <h1 className="auth-title">CryptoTerminal</h1>
        <p className="auth-subtitle">Sign in to your paper trading account</p>

        <button
          id="btn-demo-login"
          className="btn-demo"
          onClick={handleDemoLogin}
          disabled={demoTyping || loading}
          type="button"
        >
          <span className="btn-demo-icon">⚡</span>
          {demoTyping ? 'Filling credentials…' : 'Try Demo Account'}
        </button>

        <div className="auth-divider"><span>or sign in manually</span></div>

        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            id="btn-sign-in"
            className="btn-primary"
            type="submit"
            disabled={loading || demoTyping}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Create one free</Link>
        </div>
      </div>
    </div>
  );
}
