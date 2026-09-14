import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLinkSent(false);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to send reset link.');
      }

      toast.success('Password reset link was sent to your email if it exists.');
      setEmail('');
      setLinkSent(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <label>Email address:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginBottom: 12 }}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {linkSent && (
        <p style={{ marginTop: 15, color: 'green' }}>
          Password reset link has been sent if the email exists. Check your inbox and spam folder.
        </p>
      )}
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default ForgotPassword;