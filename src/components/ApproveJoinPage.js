// src/components/ApproveJoinPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ApproveJoin.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ApproveJoinPage = () => {
  const query    = useQuery();
  const navigate = useNavigate();

  const token  = query.get('token');
  const action = query.get('action');

  const [status,  setStatus]  = useState('idle');
  const [message, setMessage] = useState('');
  const [result,  setResult]  = useState(null);

  useEffect(() => {
    if (!token || !action) {
      setStatus('error');
      setMessage('Invalid link — missing token or action.');
      return;
    }
    if (!['approve', 'reject'].includes(action)) {
      setStatus('error');
      setMessage('Invalid action in link.');
      return;
    }

    // ── Get apiKey fresh from localStorage (not from state) ──
    const apiKey = localStorage.getItem('userApiKey');

    if (!apiKey) {
      // Save intent and go to login
      sessionStorage.setItem('pendingApproveToken',  token);
      sessionStorage.setItem('pendingApproveAction', action);
      // Redirect to login, which will come back here after success
      navigate(`/login?redirect=/approve-join%3Ftoken%3D${token}%26action%3D${action}`);
      return;
    }

    executeAction(token, action, apiKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const executeAction = async (tok, act, key) => {
    setStatus('loading');
    try {
      const res = await fetch(
        `https://login.dm-airtech.com/api/auth/approve-join?token=${tok}&action=${act}`,
        {
          method:  'GET',
          headers: { 'X-User-API-Key': key },
          redirect: 'manual', // ← DON'T follow 302 redirects
        }
      );

      // 302 means backend processed it successfully — treat as success
      if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 0) {
        setResult({ status: act === 'approve' ? 'approved' : 'rejected' });
        setStatus('success');
        return;
      }

      // For actual JSON responses
      const text = await res.text(); // read as text first — never crash on JSON.parse
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // If it's not JSON but status is ok, still treat as success
        if (res.ok) {
          setResult({ status: act === 'approve' ? 'approved' : 'rejected' });
          setStatus('success');
          return;
        }
        throw new Error(`Unexpected response from server`);
      }

      if (!res.ok) {
        throw new Error(data.detail || `Request failed (${res.status})`);
      }

      setResult(data);
      setStatus('success');

    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong. Please try again.');
    }
  };


  // ── Loading ──
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="approvejoin-page">
        <div className="approvejoin-card">
          <div className="approvejoin-icon spinning">⏳</div>
          <h2 className="approvejoin-title">Processing...</h2>
          <p className="approvejoin-body">Please wait while we process this request.</p>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === 'success') {
    const approved = result?.status === 'approved';
    return (
      <div className="approvejoin-page">
        <div className="approvejoin-card">
          <div className="approvejoin-icon">{approved ? '✅' : '❌'}</div>
          <h2 className="approvejoin-title">
            Request {approved ? 'Approved' : 'Rejected'}
          </h2>
          <p className="approvejoin-body">
            {approved
              ? 'The user has been approved and their API key has been sent to them.'
              : 'The user has been rejected and notified by email.'}
          </p>
          <button
            className="approvejoin-btn primary"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Error ──
  return (
    <div className="approvejoin-page">
      <div className="approvejoin-card">
        <div className="approvejoin-icon">⚠️</div>
        <h2 className="approvejoin-title">Something went wrong</h2>
        <p className="approvejoin-body approvejoin-error">{message}</p>
        <button
          className="approvejoin-btn secondary"
          onClick={() => navigate('/')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ApproveJoinPage;