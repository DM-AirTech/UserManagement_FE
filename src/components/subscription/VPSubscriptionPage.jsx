// src/components/subscription/VPSubscriptionPage.jsx
//
// Mirrors SubscriptionPage.jsx's structure and reuses its CSS classes
// (imports the same SubscriptionPage.css) — different endpoints, no
// api_limit/usage bar, and a much simpler feature grid since VertiPlace's
// four tiers differ mainly by coverage and price, not per-feature access.
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./SubscriptionPage.css"; 
const API_BASE = process.env.REACT_APP_API_BASE_URL;

const VPSubscriptionPage = () => {
  const [subStatus, setSubStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [agreedPlanKey, setAgreedPlanKey] = useState(null);
  const [subscribingPlan, setSubscribingPlan] = useState(null);
  const [apiPlans, setApiPlans] = useState([]);
  const [wantsToUpgrade, setWantsToUpgrade] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchSubStatus = async () => {
    const apiKey = localStorage.getItem("userApiKey");
    if (!apiKey) {
      setSubLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/vertiplace-subscriptions/status`, {
        headers: { "X-User-API-Key": apiKey },
      });
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
        if (data.status === "cancelled") {
          toast.info("Your VertiPlace subscription has ended. Resubscribe below to regain access.", {
            autoClose: 8000,
          });
        } else if (data.status === "failed") {
          toast.error("Your last VertiPlace payment failed. Please try subscribing again.", {
            autoClose: 8000,
          });
        }
      }
    } catch (err) {
      console.error("VertiPlace status fetch failed:", err);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    fetchSubStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE}/vertiplace-subscriptions/plans`);
        if (!res.ok) throw new Error("Failed to fetch VertiPlace plans");
        setApiPlans(await res.json());
      } catch (err) {
        console.error("VertiPlace plans fetch failed:", err);
        toast.error("Could not load VertiPlace prices.");
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (productCode, tierName, interval) => {
    const apiKey = localStorage.getItem("userApiKey");
    const planKey = `${tierName}-${interval}`;
    setSubscribingPlan(planKey);

    try {
      const matched = apiPlans.find((p) => p.product_code === productCode);
      if (!matched) {
        toast.error("Plan not found. Please contact support.");
        return;
      }

      const res = await fetch(
        `${API_BASE}/vertiplace-subscriptions/checkout?plan_id=${matched.id}`,
        {
          method: "POST",
          headers: { "X-User-API-Key": apiKey },
        }
      );
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("You already have an active VertiPlace subscription. Cancel it first to switch plans.", {
            autoClose: 8000,
          });
        } else {
          throw new Error(data.detail || "Checkout failed");
        }
        return;
      }

      if (data.checkout_url) {
        toast.info("Redirecting to payment...", { autoClose: 2000 });
        window.location.href = data.checkout_url;
      } else {
        // Free trial — activated immediately, no redirect
        toast.success(data.message || "Trial activated.");
        await fetchSubStatus();
      }
    } catch (err) {
      console.error("VertiPlace subscription error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubscribingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your VertiPlace subscription?")) return;
    try {
      const res = await fetch(`${API_BASE}/vertiplace-subscriptions/cancel`, {
        method: "POST",
        headers: { "X-User-API-Key": localStorage.getItem("userApiKey") },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Subscription updated.");
        setWantsToUpgrade(false);
        await fetchSubStatus();
      } else {
        toast.error(data.detail || "Cancellation failed.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const featureCategories = [
    {
      category: "Data",
      features: [{ label: "Data Tier", detail: "All plans include full Tier 1 data access." }],
    },
    {
      category: "Usage",
      features: [
        { label: "API Access", detail: "No metered API call limit on any plan." },
        { label: "GUI Access", detail: "No seat or usage limit on the web interface." },
      ],
    },
    {
      category: "Weather Data",
      features: [{ label: "Data Resolution", detail: "High-resolution weather data on every plan." }],
      },
    {
      category: "Coverage",
      features: [{ label: "Geographical Coverage", detail: "Where your subscription is valid for use." }],
    },
    {
      category: "Service Level Agreement",
      features: [
        { label: "Support", detail: "Data and software provided as-is, with a 48-hour response time." },
        { label: "Weather Fit Advisory", detail: "Custom data analysis, CONOPS-weather design" },
      ],
    },
  ];

  const getApiPrice = (productCode) => {
    const plan = apiPlans.find((p) => p.product_code === productCode);
    if (!plan) return "Loading...";
    return plan.price === 0 ? "Free" : `€${Number(plan.price).toLocaleString()}`;
  };

  const plans = [
    {
      tier: "Free",
      productCode: "vertiplace_free_monthly",
      monthlyPrice: getApiPrice("vertiplace_free_monthly"),
      yearlyPrice: getApiPrice("vertiplace_free_monthly"),
      interval: "trial",
      features: [
        ["Data Tier", true],
        ["API Access", true],
        ["GUI Access", true],
        ["Data Resolution", true],
        ["Geographical Coverage", "Worldwide (7-day trial)"],
        ["Support", true],
        ["Weather Fit Advisory", true],
      ],
    },
    {
      tier: "Startup",
      productCode:
        billingCycle === "monthly" ? "vertiplace_startup_monthly" : "vertiplace_startup_yearly",
      monthlyPrice: getApiPrice("vertiplace_startup_monthly"),
      yearlyPrice: getApiPrice("vertiplace_startup_yearly"),
      interval: billingCycle,
      features: [
        ["Data Tier", true],
        ["API Access", true],
        ["GUI Access", true],
        ["Data Resolution", true],
        ["Geographical Coverage", "Single country"],
        ["Support", true],
        ["Weather Fit Advisory", true]
      ],
    },
    {
      tier: "Scale Up",
      productCode:
        billingCycle === "monthly" ? "vertiplace_scaleup_monthly" : "vertiplace_scaleup_yearly",
      monthlyPrice: getApiPrice("vertiplace_scaleup_monthly"),
      yearlyPrice: getApiPrice("vertiplace_scaleup_yearly"),
      interval: billingCycle,
      features: [
        ["Data Tier", true],
        ["API Access", true],
        ["GUI Access", true],
        ["Data Resolution", true],
        ["Geographical Coverage", "Worldwide"],
        ["Support", true],
        ["Weather Fit Advisory", true]
      ],
    },
    {
      tier: "Corporate",
      productCode: "corporate",
      monthlyPrice: "Contact us",
      yearlyPrice: "Contact us",
      interval: "custom",
      features: [
        ["Data Tier", true],
        ["API Access", true],
        ["GUI Access", true],
        ["Data Resolution", true],
        ["Geographical Coverage", "Customised (worldwide)"],
        ["Support", true],
        ["Weather Fit Advisory", true]
      ],
    },
  ];

  const getButtonState = (plan) => {
    const isFree = plan.tier.toLowerCase() === "free";
    const isCorporate = plan.tier.toLowerCase() === "corporate";
    if (isCorporate) return "contact";
    if (subLoading) return "loading";
    if (subStatus?.status === "active") {
      return subStatus.product_code === plan.productCode ? "current" : "upgrade";
    }
    return isFree ? "trial" : "subscribe";
  };

  const isActiveSubscriber = subStatus?.status === "active";
  const showPlansSection = !isActiveSubscriber || wantsToUpgrade;

  const renderCurrentPlanCard = () => {
    if (subLoading) {
      return (
        <div className="current-plan-card current-plan-card--loading">
          <span>Checking your VertiPlace subscription status…</span>
        </div>
      );
    }
    if (!isActiveSubscriber) return null;

    return (
      <div className="current-plan-card">
        <div className="current-plan-card__top">
          <div>
            <span className="current-plan-card__badge">Active Subscription</span>
            <h2 className="current-plan-card__plan-name">{subStatus.plan_name}</h2>
          </div>
          {!subStatus.cancel_at_period_end && (
            <button className="cancel-sub-btn" onClick={handleCancelSubscription}>
              Cancel subscription
            </button>
          )}
        </div>

        {subStatus.cancel_at_period_end ? (
          subStatus.current_period_end && (
            <p className="current-plan-card__note current-plan-card__note--warning">
              Cancelled — active until {new Date(subStatus.current_period_end).toLocaleDateString()}
            </p>
          )
        ) : (
          subStatus.current_period_end && (
            <p className="current-plan-card__note">
              {subStatus.price === 0 ? "Trial ends" : "Renews"}{" "}
              {new Date(subStatus.current_period_end).toLocaleDateString()}
            </p>
          )
        )}

        <button
          className="current-plan-card__toggle-btn"
          onClick={() => setWantsToUpgrade((prev) => !prev)}
        >
          {wantsToUpgrade ? "Hide plan options ▲" : "Change or upgrade plan ▼"}
        </button>
      </div>
    );
  };

  return (
    <div className="subscription-page">
      <button onClick={() => navigate(-1)} className="go-back-button">
        ← Go Back
      </button>

      <h1>
        {isActiveSubscriber && !wantsToUpgrade
          ? "Your VertiPlace Subscription"
          : "Choose the Right VertiPlace Plan"}
      </h1>

      {renderCurrentPlanCard()}

      {showPlansSection && (
        <>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              className={billingCycle === "monthly" ? "billing-toggle active" : "billing-toggle"}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={billingCycle === "yearly" ? "billing-toggle active" : "billing-toggle"}
            >
              Yearly
            </button>
          </div>

          <div className="product-section">
            <h2>VertiPlace</h2>
            <p className="product-description">
              Mission planning, airspace management, and dispatch coordination — worldwide or scoped to
              your country, at a flat monthly rate.
            </p>

            <div className="table-wrapper">
              <div className="comparison-grid">
                <div className="grid-row header-row">
                  <div className="grid-cell feature-col">
                    <strong>Features</strong>
                  </div>
                  {plans.map((plan, idx) => (
                    <div key={idx} className="grid-cell plan-header-col">
                      <h3>{plan.tier}</h3>
                      <p>
                        {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                        {plan.interval !== "custom" && plan.interval !== "trial" && (
                          <span style={{ fontSize: "0.75rem", color: "#888" }}> / {billingCycle}</span>
                        )}
                        {plan.interval === "trial" && (
                          <span style={{ fontSize: "0.75rem", color: "#888" }}> / 7 days</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {featureCategories.map((cat, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <div className="grid-row category-row">
                      <div className="grid-cell feature-col category-header">
                        <h4>{cat.category}</h4>
                      </div>
                      {plans.map((_, idx) => (
                        <div key={idx} className="grid-cell plan-feature-col category-spacer" />
                      ))}
                    </div>

                    {cat.features.map((feature, featIdx) => (
                      <div key={featIdx} className="grid-row">
                        <div className="grid-cell feature-col">
                          <details>
                            <summary>{feature.label}</summary>
                            <p className="feature-detail">{feature.detail}</p>
                          </details>
                        </div>
                        {plans.map((plan, idx) => {
                          const found = plan.features.find(([l]) => l === feature.label);
                          const value = found ? found[1] : false;
                          return (
                            <div key={idx} className="grid-cell plan-feature-col">
                              {value === true ? (
                                <svg className="feature-check" viewBox="0 0 16 16" aria-label="Included">
                                  <path d="M3 8.5L6.5 12L13 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : value === false ? (
                                <span className="feature-dash" aria-hidden="true">–</span>
                              ) : (
                                <span className="value-text">{value}</span>
                              )}
                            </div>
                          );
                        })}                        
                      </div>
                    ))}
                  </React.Fragment>
                ))}

                <div className="grid-row subscribe-row">
                  <div className="grid-cell feature-col" />
                  {plans.map((plan, idx) => {
                    const planKey = `${plan.tier}-${billingCycle}`;
                    const isLoading = subscribingPlan === planKey;
                    const hasAgreed = agreedPlanKey === planKey;
                    const isCorporate = plan.tier.toLowerCase() === "corporate";
                    const btnState = getButtonState(plan);

                    return (
                      <div key={idx} className="grid-cell plan-feature-col">
                        <div>
                          {!isCorporate && (btnState === "subscribe" || btnState === "trial") && (
                            <label style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                              <input
                                type="checkbox"
                                checked={hasAgreed}
                                onChange={(e) => setAgreedPlanKey(e.target.checked ? planKey : null)}
                              />{" "}
                              I agree to the{" "}
                              <a
                                href="https://www.dm-airtech.com/privacy-policy/"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Terms & Conditions
                              </a>
                            </label>
                          )}

                          {btnState === "contact" && (
                            <button className="subscribe-btn" onClick={() => navigate("/contact")}>
                              Contact Us
                            </button>
                          )}
                          {btnState === "loading" && (
                            <button className="subscribe-btn" disabled>
                              Loading...
                            </button>
                          )}
                          {btnState === "current" && (
                            <button className="subscribe-btn current-plan" disabled>
                              Current Plan
                            </button>
                          )}
                          {btnState === "trial" && (
                            <button
                              className="subscribe-btn"
                              disabled={!hasAgreed || isLoading}
                              style={!hasAgreed ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                              onClick={() => handleSubscribe(plan.productCode, plan.tier, plan.interval)}
                            >
                              {isLoading ? "Starting..." : "Start Free Trial"}
                            </button>
                          )}
                          {btnState === "subscribe" && (
                            <button
                              className="subscribe-btn"
                              disabled={!hasAgreed || isLoading}
                              style={!hasAgreed ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                              onClick={() => handleSubscribe(plan.productCode, plan.tier, plan.interval)}
                            >
                              {isLoading ? "Processing..." : "Subscribe"}
                            </button>
                          )}
                          {btnState === "upgrade" && (
                            <button
                              className="subscribe-btn"
                              onClick={() => {
                                if (window.confirm(`Switch to ${plan.tier} plan?`)) {
                                  handleSubscribe(plan.productCode, plan.tier, plan.interval);
                                }
                              }}
                            >
                              Switch Plan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {isActiveSubscriber && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button className="current-plan-card__toggle-btn" onClick={() => setWantsToUpgrade(false)}>
                ▲ Back to my subscription
              </button>
            </div>
          )}
        </>
      )}

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default VPSubscriptionPage;