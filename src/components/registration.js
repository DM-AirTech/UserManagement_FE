// src/components/registration.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './registration.css';

// Extract the domain portion of an email address, e.g. "a@b.com" -> "b.com"
const extractDomain = (email) => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};

const RegistrationPage = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Core form fields
  const [username, setUsername] = useState('');
  const [org_name, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  // Admin / invite flow fields
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [inviteToken, setInviteToken] = useState(null);
  const [lockedDomain, setLockedDomain] = useState(null);

  // Domain lookup state (only relevant when there's no invite)
  const [domainStatus, setDomainStatus] = useState(null);
  const [domainChecking, setDomainChecking] = useState(false);
  const debounceRef = useRef(null);

  // UI state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [popupError, setPopupError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite validation state
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  const isLengthValid = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[^\w\s]/.test(password);

  // On mount, check for an ?invite= token in the URL and validate it
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('invite');
    if (!token) return;

    setInviteToken(token);
    setInviteLoading(true);

    fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/invite?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setInviteInfo(data);
          setLockedDomain(data.email_domain);
          if (data.org_name) setOrgName(data.org_name);
        } else {
          setInviteError(data.message || 'This invite link is invalid or has expired.');
        }
      })
      .catch(() => setInviteError('Could not validate invite link. Please try again.'))
      .finally(() => setInviteLoading(false));
  }, [location.search]);

  // Live domain lookup, debounced 600ms after the email changes.
  // Skipped entirely when registering via an invite link.
  useEffect(() => {
    if (inviteToken) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const domain = extractDomain(email);
    if (!domain || !email.includes('@') || !email.includes('.')) {
      setDomainStatus(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setDomainChecking(true);
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/auth/check-domain?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        setDomainStatus(data);
      } catch {
        setDomainStatus(null);
      } finally {
        setDomainChecking(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [email, inviteToken]);

  const renderDomainBanner = () => {
    if (inviteToken) {
      if (inviteLoading) return <p className="domain-banner checking">Validating invite link…</p>;
      if (inviteError) return <p className="domain-banner error">{inviteError}</p>;
      if (inviteInfo)
        return (
          <p className="domain-banner info">
            Invite valid — you're joining <strong>{inviteInfo.org_name}</strong>. Your email must end
            in <strong>@{inviteInfo.email_domain}</strong>.
          </p>
        );
      return null;
    }

    if (domainChecking) return <p className="domain-banner checking">Checking domain…</p>;
    if (!domainStatus) return null;

    if (domainStatus.org_exists) {
      return (
        <p className="domain-banner warning">
          <strong>{domainStatus.org_name}</strong> already exists for @{domainStatus.domain}.{' '}
          {domainStatus.has_admin
            ? 'The admin will be asked to approve your account.'
            : 'No admin is set yet — you may register as admin.'}
        </p>
      );
    }

    return (
      <p className="domain-banner success">
        No organisation found for @{domainStatus.domain} — you can register as admin.
      </p>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPopupError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setPopupError('Passwords do not match.');
      return;
    }
    if (!strongPasswordRegex.test(password)) {
      setPopupError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setPopupError('Please enter a valid email address.');
      return;
    }
    if (!role.trim()) {
      setPopupError('Please enter a role.');
      return;
    }
    if (inviteToken && lockedDomain) {
      const domain = extractDomain(email);
      if (domain !== lockedDomain) {
        setPopupError(`Your email must use the @${lockedDomain} domain for this invite.`);
        return;
      }
    }
    if (!termsAccepted) {
      setPopupError('You must accept the Terms and Conditions.');
      return;
    }
    if (!privacyAccepted) {
      setPopupError('You must accept the Privacy Policy.');
      return;
    }

    const payload = {
      username,
      password,
      email,
      org_name,
      role,
      is_admin: inviteToken ? false : isAdmin,
      admin_email: !isAdmin && !inviteToken && adminEmail ? adminEmail : null,
      invite_token: inviteToken || null,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

            const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Registration failed with status: ${response.status}`);
      }

      if (data.api_key) {
        // Account was auto-approved and the backend handed us a session —
        // log the user in immediately instead of sending them to /login.
        onRegisterSuccess(data.api_key, {
          username: data.username,
          email: data.email,
        });
      } else {
        // Pending admin approval — no session exists yet.
        navigate('/welcome', { state: { pending: true } });
      }

      resetForm();
    } catch (err) {
      console.error('Registration error:', err);
      setPopupError(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOrgName('');
    setRole('');
    setAdminEmail('');
    setIsAdmin(false);
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setDomainStatus(null);
  };

  const ChecklistItem = ({ isValid, label }) => (
    <div className={`checklist-item ${isValid ? 'valid' : 'invalid'}`}>
      <span className="checklist-icon">{isValid ? '✓' : '–'}</span>
      <span>{label}</span>
    </div>
  );

  if (inviteToken && inviteLoading) {
    return (
      <div className="register-page">
        <div className="register-container">
          <p>Validating your invite link…</p>
        </div>
      </div>
    );
  }

  if (inviteToken && inviteError && !inviteInfo) {
    return (
      <div className="register-page">
        <div className="register-container">
          <h2 className="register-title">Invalid invite</h2>
          <p className="register-error">{inviteError}</p>
          <button className="register-submit-btn" onClick={() => navigate('/register')}>
            Register without invite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <h2 className="register-title">Create DM-AirTech account</h2>
        <p className="register-subtitle">
          {inviteInfo
            ? `You've been invited to join ${inviteInfo.org_name}.`
            : 'One DM-AirTech account gives you access to all platforms and products.'}
        </p>

        {successMessage && <p className="register-success">{successMessage}</p>}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label htmlFor="username" className="register-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="register-input"
              />
            </div>

            <div className="register-field">
              <label htmlFor="org_name" className="register-label">
                Organisation <span className="register-label-hint">use your official registered name</span>
              </label>
              <input
                type="text"
                id="org_name"
                value={org_name}
                onChange={(e) => setOrgName(e.target.value)}
                required
                disabled={!!inviteInfo}
                placeholder="e.g. DM-AirTech BV, Acme Corp Ltd"
                className={`register-input ${inviteInfo ? 'register-input-locked' : ''}`}
              />
              {!inviteInfo && (
                <p className="register-field-hint">
                  Enter it exactly as it appears on official documents, including legal suffixes such
                  as Ltd, BV, GmbH, or Inc.
                </p>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="role" className="register-label">
                Role
              </label>
              <input
                type="text"
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                placeholder="e.g. Admin, Manager, Developer, Analyst"
                className="register-input"
              />
            </div>

            <div className="register-field">
              <label htmlFor="email" className="register-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="register-input"
                placeholder={lockedDomain ? `yourname@${lockedDomain}` : ''}
              />
              {renderDomainBanner()}
            </div>

            {!inviteToken && (
              <div className="register-field register-flow-selector">
                <div className="register-checkbox-row">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={isAdmin}
                    onChange={() => {
                      setIsAdmin(!isAdmin);
                      setAdminEmail('');
                    }}
                  />
                  <label htmlFor="isAdmin" className="register-checkbox-label">
                    I am registering as the <strong>admin</strong> of my organisation
                  </label>
                </div>
                <p className="register-field-hint">
                  {isAdmin
                    ? "You'll be set as admin, and your organisation's domain will be registered."
                    : 'Tick this if you are the first person from your company to register.'}
                </p>

                {!isAdmin && (
                  <div className="register-field">
                    <label htmlFor="adminEmail" className="register-label">
                      Admin email <span className="register-label-hint">optional</span>
                    </label>
                    <input
                      type="email"
                      id="adminEmail"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Your organisation admin's email"
                      className="register-input"
                    />
                    <p className="register-field-hint">
                      The admin will need to approve your account.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="register-field">
              <label htmlFor="password" className="register-label">
                Password
              </label>
              <div className="register-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="register-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="register-checklist">
                <ChecklistItem isValid={isLengthValid} label="At least 8 characters" />
                <ChecklistItem isValid={hasUppercase} label="One uppercase letter" />
                <ChecklistItem isValid={hasLowercase} label="One lowercase letter" />
                <ChecklistItem isValid={hasDigit} label="One number" />
                <ChecklistItem isValid={hasSpecialChar} label="One symbol" />
              </div>
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword" className="register-label">
                Confirm password
              </label>
              <div className="register-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="register-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="register-toggle-btn"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="register-checkbox-row">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
              />
              <label htmlFor="terms" className="register-checkbox-label">
                I accept the{' '}
                <a href="https://www.dm-airtech.com/terms-and-conditions/" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </a>
              </label>
            </div>

            <div className="register-checkbox-row">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAccepted}
                onChange={() => setPrivacyAccepted(!privacyAccepted)}
              />
              <label htmlFor="privacy" className="register-checkbox-label">
                I accept the{' '}
                <a href="https://www.dm-airtech.com/privacy-policy/" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              className="register-submit-btn"
              disabled={isSubmitting || (inviteToken && !!inviteError)}
            >
              {isSubmitting ? 'Registering…' : 'Register'}
            </button>
          </form>
        )}
      </div>

      {popupError && (
        <div className="register-modal-overlay">
          <div className="register-modal">
            <p>{popupError}</p>
            <button onClick={() => setPopupError('')} className="register-modal-close">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;