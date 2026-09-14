// src/components/subscription/PaymentResultPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentResultPage.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const VERTIMONITOR_URL = "https://vertimonitor.dm-airtech.com";
const VERTIPLACE_URL   = "https://vertiplace.dm-airtech.com";

const PaymentResultPage = () => {
  const [subStatus, setSubStatus]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [pollCount, setPollCount]   = useState(0);
  const [paymentParam, setPaymentParam] = useState(null);

  const navigate   = useNavigate();
  const apiKey     = localStorage.getItem("userApiKey");
  const MAX_POLLS  = 10;
  const POLL_INTERVAL = 3000;

  // ── Read ?payment= param from URL ──────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("payment");
    setPaymentParam(p);
  }, []);

  // ── If Stripe sent us back via cancel_url, tell the backend right
  // away — this is a DEFINITIVE "the customer backed out" signal (unlike
  // silently closing the tab, which is genuinely ambiguous), so there's
  // no reason to make them wait on a webhook or a TTL before they can
  // try again. Fire-and-forget: this call's success/failure doesn't
  // affect what's shown on this page either way, so it's never awaited
  // or blocking, and any error is just logged, not surfaced to the user.
  useEffect(() => {
    if (paymentParam !== "failed") return;

    fetch(`${API_BASE}/subscriptions/checkout/abandon`, {
      method: "POST",
      headers: { "X-User-API-Key": apiKey },
    }).catch((err) => {
      console.error("Failed to abandon checkout (non-blocking):", err);
    });
  }, [paymentParam, apiKey]);

  // ── Fetch subscription status ───────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/subscriptions/status`, {
        headers: { "X-User-API-Key": apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
        return data;
      }
    } catch (err) {
      console.error("Status fetch failed:", err);
    }
    return null;
  }, [apiKey]);

  // ── Poll until active or max polls reached ──────────────────────
  useEffect(() => {
    if (paymentParam === null) return;

    const poll = async () => {
      setLoading(true);
      const data = await fetchStatus();
      setLoading(false);

      if (!data) return;

      // If still pending and haven't hit max polls — keep polling
      if (data.status === "pending" && pollCount < MAX_POLLS) {
        setTimeout(() => {
          setPollCount((c) => c + 1);
        }, POLL_INTERVAL);
      }
    };

    poll();
  }, [pollCount, paymentParam, fetchStatus]);

  // ── Derive page state ───────────────────────────────────────────
  const getPageState = () => {
    if (paymentParam === "failed")  return "failed";
    if (!subStatus)                 return "loading";
    if (subStatus.status === "active")   return "success";
    if (subStatus.status === "pending")  return pollCount >= MAX_POLLS ? "unprocessed" : "loading";
    if (subStatus.status === "failed")   return "failed";
    if (subStatus.status === "cancelled") return "failed";
    return "loading";
  };

  const pageState = getPageState();

  // ── Redirect to product with API key ───────────────────────────
  const goToProduct = (url) => {
    window.location.href = `${url}/#apiKey=${apiKey}`;
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="payment-result-page">
      <div className="payment-result-card">

        {/* ── LOADING / POLLING ── */}
        {pageState === "loading" && (
          <>
            <div className="result-icon spinning">⏳</div>
            <h1>Processing your payment...</h1>
            <p className="result-subtitle">
              We are confirming your payment.
              This usually takes a few seconds.
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(pollCount / MAX_POLLS) * 100}%` }}
              />
            </div>
            <p className="result-hint">
              Attempt {pollCount + 1} of {MAX_POLLS}...
            </p>
          </>
        )}

        {/* ── SUCCESS ── */}
        {pageState === "success" && (
          <>
            <div className="result-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p className="result-subtitle">
              Your subscription is now active. Here's what has been updated:
            </p>

            <div className="result-details">
              <div className="detail-row">
                <span className="detail-label">Plan</span>
                <span className="detail-value">{subStatus.plan_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value status-active">Active</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">API Calls</span>
                <span className="detail-value">
                  {subStatus.api_limit?.toLocaleString()} calls
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Billing</span>
                <span className="detail-value">
                  {subStatus.interval === "monthly" ? "Monthly" : "Yearly"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount paid</span>
                <span className="detail-value">
                  {subStatus.amount_paid != null
                    ? `${subStatus.amount_paid.toFixed(2)} ${subStatus.currency || "EUR"}`
                    : "—"}
                </span>
              </div>
              {subStatus.discount_code && (
                <div className="detail-row">
                  <span className="detail-label">Discount applied</span>
                  <span className="detail-value">
                    {subStatus.discount_code}
                    {subStatus.discount_percent != null && ` (-${subStatus.discount_percent}%)`}
                  </span>
                </div>
              )}
              {subStatus.current_period_end && (
                <div className="detail-row">
                  <span className="detail-label">Next renewal</span>
                  <span className="detail-value">
                    {new Date(subStatus.current_period_end).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {subStatus.activated_at && (
                <div className="detail-row">
                  <span className="detail-label">Activated at</span>
                  <span className="detail-value">
                    {new Date(subStatus.activated_at).toLocaleString("en-GB")}
                  </span>
                </div>
              )}
              {subStatus.is_custom ? (
                <div className="result-details">
                    <div className="detail-row">
                    <span className="detail-label">Plan</span>
                    <span className="detail-value">{subStatus.plan_name}</span>
                    </div>
                    <div className="detail-row">
                    <span className="detail-label">Type</span>
                    <span className="detail-value" style={{ color: "#856404" }}>
                        Custom / Internal
                    </span>
                    </div>
                    <div className="detail-row">
                    <span className="detail-label">API Calls</span>
                    <span className="detail-value">Unlimited</span>
                    </div>
                    <div className="detail-row">
                    <span className="detail-label">Expires</span>
                    <span className="detail-value">Never</span>
                    </div>
                </div>
                ) : (
                <div className="result-details">
                    {/* existing detail rows */}
                </div>
                )}
            </div>

            <p className="result-hint">
              Your API limit has been updated. You can now use your API key
              across our products.
            </p>

            <div className="product-buttons">
              <button
                className="product-btn vertimonitor-btn"
                onClick={() => goToProduct(VERTIMONITOR_URL)}
              >
                <span className="product-btn-icon">🛰️</span>
                <span>
                  <strong>Go to VertiMonitor</strong>
                  <small>Real-time airspace monitoring</small>
                </span>
              </button>

              <button
                className="product-btn vertiplace-btn"
                onClick={() => goToProduct(VERTIPLACE_URL)}
              >
                <span className="product-btn-icon">📍</span>
                <span>
                  <strong>Go to VertiPlace</strong>
                  <small>Vertiport location intelligence</small>
                </span>
              </button>
            </div>

            <button
              className="back-btn"
              onClick={() => navigate("/subscribe")}
            >
              ← Back to subscription page
            </button>
          </>
        )}

        {/* ── UNPROCESSED (pending after max polls) ── */}
        {pageState === "unprocessed" && (
          <>
            <div className="result-icon">⚠️</div>
            <h1>Payment Received</h1>
            <p className="result-subtitle">
              Your payment was received but your subscription
              is still being processed. This can take a few minutes.
            </p>

            <div className="result-details">
              <div className="detail-row">
                <span className="detail-label">Payment status</span>
                <span className="detail-value status-pending">Processing</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">What to do</span>
                <span className="detail-value">
                  Wait a moment and refresh this page.
                </span>
              </div>
            </div>

            <p className="result-hint">
              If your subscription does not activate within 10 minutes,
              please contact us at{" "}
              <a href="mailto:support@dm-airtech.com">support@dm-airtech.com</a>
              {" "}with your payment reference.
            </p>

            <div className="unprocessed-buttons">
              <button
                className="product-btn vertimonitor-btn"
                onClick={() => {
                  setPollCount(0);
                  fetchStatus();
                }}
              >
                🔄 Check again
              </button>

              <button
                className="back-btn"
                onClick={() => navigate("/subscribe")}
              >
                ← Back to subscription page
              </button>
            </div>
          </>
        )}

        {/* ── FAILED ── */}
        {pageState === "failed" && (
          <>
            <div className="result-icon">❌</div>
            <h1>Payment Failed</h1>
            <p className="result-subtitle">
              Your payment was not completed. No charges have been made
              to your account.
            </p>

            <div className="result-details">
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value status-failed">Failed</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">What happened</span>
                <span className="detail-value">
                  The payment was cancelled, declined, or expired.
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Your account</span>
                <span className="detail-value">
                  No changes have been made.
                </span>
              </div>
            </div>

            <p className="result-hint">
              Please try again. If the problem persists contact us at{" "}
              <a href="mailto:support@dm-airtech.com">support@dm-airtech.com</a>
            </p>

            <div className="product-buttons">
              <button
                className="product-btn vertimonitor-btn"
                onClick={() => navigate("/subscribe")}
              >
                🔄 Try again
              </button>

              <button
                className="back-btn"
                onClick={() => navigate("/")}
              >
                ← Go to dashboard
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentResultPage;