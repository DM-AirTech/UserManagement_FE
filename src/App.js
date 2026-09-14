// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import './brand.css';
import LoginPage          from './components/login';
import RegistrationPage   from './components/registration';
import ApproveJoinPage    from './components/ApproveJoinPage';
import './App.css';
import SubscriptionPage   from './components/subscription/SubscriptionPage';
import ContactForm        from "./components/subscription/ContactForm";
import ForgotPasswordPage from './components/ForgotPassword';
import ResetPasswordPage  from './components/ResetPassword';
import PaymentResultPage  from './components/subscription/PaymentResultPage';
import WelcomePage        from './components/WelcomePage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('userApiKey'));
  const [username,        setUsername]        = useState(localStorage.getItem('username') || '');

  // If a cross-app link (e.g. VertiMonitor's "Manage Subscription") lands here
  // with #apiKey=... in the URL, hold off rendering routes until we've either
  // consumed that token or confirmed there wasn't one — otherwise ProtectedRoute
  // redirects to /login before the token is ever read.
  const hashHasApiKey = new URLSearchParams(window.location.hash.slice(1)).has('apiKey');
  const [authChecked, setAuthChecked] = useState(!hashHasApiKey);

  useEffect(() => {
    const handleStorageChange = () => {
      const key            = localStorage.getItem('userApiKey');
      const storedUsername = localStorage.getItem('username');
      setIsAuthenticated(!!key);
      setUsername(storedUsername || '');
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Consume an incoming ?apiKey from the URL hash (cross-app handoff).
  useEffect(() => {
    if (!hashHasApiKey) return;

    const params  = new URLSearchParams(window.location.hash.slice(1));
    const apiKey  = params.get('apiKey');

    // Strip the hash immediately so the key never sits in browser history longer than needed.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/me`, {
      headers: { 'X-User-API-Key': apiKey },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Could not verify token: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        handleLoginSuccess(apiKey, {
          username: data.username,
          email: data.email,
        });
      })
      .catch((err) => {
        console.error('Cross-app token handoff failed:', err);
        // Token was bad/expired — fall through to the normal login page.
      })
      .finally(() => setAuthChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = (apiKey, userData) => {
    localStorage.setItem('userApiKey', apiKey);
    localStorage.setItem('username',   userData.username);
    localStorage.setItem('email',      userData.email);
    setIsAuthenticated(true);
    setUsername(userData.username);
  };

  const handleLogout = (navigateFunc) => {
    localStorage.removeItem('userApiKey');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    navigateFunc('/login');
  };

  const Logout = () => {
    const navigate = useNavigate();
    useEffect(() => { handleLogout(navigate); }, [navigate]);
    return <div>Logging out...</div>;
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  const LoginWithRedirect = () => {
    const location = useLocation();
    const navigate = useNavigate();

    if (isAuthenticated) {
      const params         = new URLSearchParams(location.search);
      const redirectTarget = params.get('redirect');
      if (redirectTarget) return <Navigate to={decodeURIComponent(redirectTarget)} replace />;
      return <Navigate to="/" replace />;
    }

    return (
      <LoginPage
        onLoginSuccess={(apiKey, userData) => {
          handleLoginSuccess(apiKey, userData);
          const params         = new URLSearchParams(location.search);
          const redirectTarget = params.get('redirect');
          navigate(redirectTarget ? decodeURIComponent(redirectTarget) : '/welcome');
        }}
      />
    );
  };

  if (!authChecked) {
    return <div className="auth-check-loading">Signing you in…</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login"           element={<LoginWithRedirect />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/logout"          element={<Logout />} />
        <Route path="/welcome"         element={<WelcomePage />} />
        <Route path="/register"        element={isAuthenticated ? <Navigate to="/" replace /> : <RegistrationPage />} />
        <Route path="/approve-join"    element={<ApproveJoinPage />} />

        <Route path="/" element={<ProtectedRoute><Navigate to="/welcome" replace /></ProtectedRoute>} />

        <Route path="/subscribe"      element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/payment-result" element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>} />
        <Route path="/contact"        element={<ProtectedRoute><ContactForm /></ProtectedRoute>} />

        <Route path="*" element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;