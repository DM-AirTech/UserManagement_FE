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
  const [product, setProduct] = useState("vertimonitor");

  const navigate   = useNavigate();
  const apiKey     = localStorage.getItem("userApiKey");
  const MAX_POLLS  = 10;
  const POLL_INTERVAL = 3000;

  // ── Read ?payment= and ?product= params from URL ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPaymentParam(params.get("payment"));
    setProduct(params.get("product") || "vertimonitor");
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

    const abandonEndpoint =
      product === "vertiplace"
        ? `${API_BASE}/vertiplace-subscriptions/checkout/abandon`
        : `${API_BASE}/subscriptions/checkout/abandon`;

    fetch(abandonEndpoint, {
      method: "POST",
      headers: { "X-User-API-Key": apiKey },
    }).catch((err) => {
      console.error("Failed to abandon checkout (non-blocking):", err);
    });
  }, [paymentParam, product, apiKey]);

  // ── Fetch subscription status ───────────────────────────────────
  const fetchStatus = useCallback(async () => {
    const statusEndpoint =
      product === "vertiplace"
        ? `${API_BASE}/vertiplace-subscriptions/status`
        : `${API_BASE}/subscriptions/status`;
    try {
      const res = await fetch(statusEndpoint, {
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
  }, [apiKey, product]);

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
            <div className="result-icon spinning" aria-hidden="true">
              <span className="spinner-ring" />
            </div>
            <h1>Confirming your payment</h1>
            <p className="result-subtitle">
              We're finalizing things with your payment provider.
              This usually takes just a few seconds.
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(pollCount / MAX_POLLS) * 100}%` }}
              />
            </div>
            <p className="result-hint">
              Attempt {pollCount + 1} of {MAX_POLLS}
            </p>
          </>
        )}

        {/* ── SUCCESS ── */}
        {pageState === "success" && (
          <>
            <div className="result-icon result-icon--success" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1>You're all set</h1>
            <p className="result-subtitle">
              Your subscription is active. Here's a summary of your plan.
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

              {subStatus.is_custom ? (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Type</span>
                    <span className="detail-value detail-value--muted">Custom / Internal</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">API Calls</span>
                    <span className="detail-value">Unlimited</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Expires</span>
                    <span className="detail-value">Never</span>
                  </div>
                </>
              ) : (
                <>
                  {product !== "vertiplace" && (
                    <div className="detail-row">
                      <span className="detail-label">API Calls</span>
                      <span className="detail-value">
                        {subStatus.api_limit?.toLocaleString()} calls
                      </span>
                    </div>
                  )}
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
                </>
              )}
            </div>

            <p className="result-hint">
              Your API key is now active across our products. You'll receive
              your invoices by email from{" "}
              <span className="result-hint-strong">donotreply@dm-airtech.com</span>.
            </p>

            <div className="product-buttons">
              <button
                className="product-btn vertimonitor-btn"
                onClick={() => goToProduct(VERTIMONITOR_URL)}
              >
                <span>
                  <strong>Go to VertiMonitor</strong>
                  <small>Real-time airspace monitoring</small>
                </span>
              </button>

              <button
                className="product-btn vertiplace-btn"
                onClick={() => goToProduct(VERTIPLACE_URL)}
              >
                <span>
                  <strong>Go to VertiPlace</strong>
                  <small>Vertiport location intelligence</small>
                </span>
              </button>
            </div>

            <button
              className="back-btn"
              onClick={() => navigate(product === "vertiplace" ? "/subscribe-vertiplace" : "/subscribe")}
            >
              Back to subscription page
            </button>
          </>
        )}

        {/* ── UNPROCESSED (pending after max polls) ── */}
        {pageState === "unprocessed" && (
          <>
            <div className="result-icon result-icon--pending" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <h1>Payment received</h1>
            <p className="result-subtitle">
              Your payment was received but your subscription is still
              being processed. This can take a few minutes.
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
                Check again
              </button>

              <button
                className="back-btn"
                onClick={() => navigate(product === "vertiplace" ? "/subscribe-vertiplace" : "/subscribe")}
              >
                Back to subscription page
              </button>
            </div>
          </>
        )}

        {/* ── FAILED ── */}
        {pageState === "failed" && (
          <>
            <div className="result-icon result-icon--failed" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1>Payment failed</h1>
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
                onClick={() => navigate(product === "vertiplace" ? "/subscribe-vertiplace" : "/subscribe")}
              >
                Try again
              </button>

              <button
                className="back-btn"
                onClick={() => navigate("/")}
              >
                Go to dashboard
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentResultPage;