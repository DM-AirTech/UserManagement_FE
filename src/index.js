import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Suppress ResizeObserver loop warning in development
const observer = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends observer {
  constructor(callback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        callback(entries, observer);
      });
    });
  }
};
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
