import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './login.css';

const LoginPage = ({ onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [userIdentifier, setUserIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get('payment') === 'success') {
      toast.success('✅ Payment successful! You can now log in.');
      window.history.replaceState({}, document.title, location.pathname);
    }
    if (params.get('info') === 'user_approved') {
      toast.success('✅ Your account has been approved! You can now log in.');
      window.history.replaceState({}, document.title, location.pathname);
    }
    if (params.get('info') === 'user_rejected') {
      toast.error('❌ Your join request was rejected by the admin.');
      window.history.replaceState({}, document.title, location.pathname);
    }
    if (params.get('info') === 'already_actioned') {
      toast.info('ℹ️ This request has already been actioned.');
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  if (localStorage.getItem('userApiKey')) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/password-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userIdentifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Login failed. Status: ${response.status}`);
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.api_key, {
          id: data.user_id,
          username: data.username,
          email: data.email,
        });
      }

      // ← READ the ?redirect= param and go there after login
      const params = new URLSearchParams(location.search);
      const redirectTarget = params.get('redirect');
      navigate(redirectTarget ? decodeURIComponent(redirectTarget) : '/');

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">DM-AirTech</h1>
        <p className="login-message">
          Access Our Weather Intelligence Platform.
        </p>

        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label htmlFor="userIdentifier" className="login-label">
              Username or Email:
            </label>
            <input
              type="text"
              id="userIdentifier"
              value={userIdentifier}
              onChange={handleInputChange(setUserIdentifier)}
              required
              className="login-input"
              autoComplete="username"
              placeholder="e.g., Maverick or maverick@example.com"
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password" className="login-label">
              Password:
            </label>
            <div className="login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handleInputChange(setPassword)}
                required
                className="login-input"
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="login-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="login-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="login-register-text">
          Need an account for flight operations?{' '}
          <Link to="/register">Register for Access</Link>
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default LoginPage;