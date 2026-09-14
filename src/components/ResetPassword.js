import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [error, setError] = useState('');
  const [popupError, setPopupError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token');
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setError('Missing password reset token.');
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/auth/reset-password?token=${token}`,
          { method: 'GET' }
        );

        const data = await res.json();

        if (res.ok && data.message && data.message.toLowerCase().includes('valid token')) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          setError(data.message || 'Invalid or expired token.');
        }
      } catch (err) {
        setIsTokenValid(false);
        setError('Error validating token. Please try again.');
      }
    };

    validateToken();
  }, [token]);

  if (isTokenValid === null) {
    return <p>Validating reset token...</p>;
  }

  if (!isTokenValid) {
    return <p style={{ padding: '20px', color: 'red' }}>{error || 'Invalid or expired token.'}</p>;
  }

  if (resetSuccess) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
        <h2>Password Reset Successful!</h2>
        <p>Your password has been updated. You can now log in using your new password.</p>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!strongPasswordRegex.test(newPassword)) {
      setPopupError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to reset password.');
      }

      setResetSuccess(true);
    } catch (err) {
      setPopupError(err.message || 'An error occurred while resetting password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-password" style={{ display: 'block', marginBottom: '8px' }}>
          Enter your new password:
        </label>
        <input
          type="password"
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={{ width: '70%', padding: '10px', marginBottom: '15px', fontSize: '16px' }}
          placeholder="New password"
        />
        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px', fontSize: '16px' }}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {popupError && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '20px 30px', borderRadius: '8px', maxWidth: '400px', width: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.25)', textAlign: 'center', fontSize: '16px' }}>
            <p style={{ marginBottom: '20px' }}>{popupError}</p>
            <button
              onClick={() => setPopupError('')}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordPage;