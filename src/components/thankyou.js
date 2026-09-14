// src/components/ThankYouPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const ThankYouPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>✅ Thank You!</h1>
      <p>Your payment was successful.</p>
      <Link to="/login">
        <button style={{ marginTop: '20px', padding: '12px 24px' }}>Log In Now</button>
      </Link>
    </div>
  );
};

export default ThankYouPage;
