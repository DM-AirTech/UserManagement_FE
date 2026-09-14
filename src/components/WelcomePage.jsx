// src/components/WelcomePage.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = () => {
  const location = useLocation();
  const isPending = location.state?.pending === true;

  const apiKey   = localStorage.getItem('userApiKey') || '';
  const username = localStorage.getItem('username')   || '';

  const go = (url) => { window.location.href = url; };

  if (isPending) {
    return (
      <div className="wp-page">
        <div className="wp-topbar">
          <div className="wp-logobox">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="wp-brandname">DM AirTech</span>
        </div>

        <div className="wp-pending">
          <div className="wp-pending-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <p className="wp-pending-title">Almost there</p>
          <p className="wp-pending-desc">
            Your account request has been sent to your organisation's admin.
            You'll get an email as soon as it's approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-page">
      <div className="wp-topbar">
        <div className="wp-logobox">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="wp-brandname">DM AirTech</span>
      </div>

      <p className="wp-welcome">
        Welcome{username ? `, ${username}` : ''} — choose your workspace to get started
      </p>

      <div className="wp-grid">
        <button className="wp-card" onClick={() => go(`https://vertimonitor.dm-airtech.com/#apiKey=${apiKey}`)}>
          <div className="wp-icon dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <p className="wp-tag">Monitoring</p>
          <p className="wp-title">VertiMonitor</p>
          <p className="wp-desc">Live telemetry, alerts, and performance dashboards for your drone fleet.</p>
          <ul className="wp-features">
            <li>Real-time telemetry</li>
            <li>Fleet health overview</li>
            <li>Alert management</li>
          </ul>
          <div className="wp-footer">
            <span className="wp-footer-label">Open app</span>
            <span className="wp-arrow">→</span>
          </div>
        </button>

        <button className="wp-card" onClick={() => go(`https://vertiplace.dm-airtech.com/#apiKey=${apiKey}`)}>
          <div className="wp-icon amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="#081e2d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <p className="wp-tag">Operations</p>
          <p className="wp-title">VertiPlace</p>
          <p className="wp-desc">Mission planning, airspace management, and dispatch coordination hub.</p>
          <ul className="wp-features">
            <li>Mission planning</li>
            <li>Airspace management</li>
            <li>Dispatch &amp; routing</li>
          </ul>
          <div className="wp-footer">
            <span className="wp-footer-label">Open app</span>
            <span className="wp-arrow">→</span>
          </div>
        </button>
        <button className="wp-card" onClick={() => go(`https://wetwin.dm-airtech.com/#apiKey=${apiKey}`)}>
          <div className="wp-icon" style={{ background: '#1a6b3c' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <p className="wp-tag">Predictions</p>
          <p className="wp-title">WeTwin</p>
          <p className="wp-desc">Digital twin weather simulations and predictive analytics for your operations.</p>
          <ul className="wp-features">
            <li>Weather simulations</li>
            <li>Predictive analytics</li>
            <li>Digital twin models</li>
          </ul>
          <div className="wp-footer">
            <span className="wp-footer-label">Open app</span>
            <span className="wp-arrow">→</span>
          </div>
        </button>
      </div>

      <p className="wp-signout">
        Signed in to your DM-AirTech account &nbsp;·&nbsp;
        <a href="/login" onClick={(e) => {
          e.preventDefault();
          localStorage.removeItem('userApiKey');
          localStorage.removeItem('username');
          localStorage.removeItem('email');
          window.location.href = '/login';
        }}>Sign out</a>
      </p>
    </div>
  );
};

export default WelcomePage;