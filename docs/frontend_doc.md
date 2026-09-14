# Subscriptions & Payment UI

**Repository:** `User_Management` (`user_management_app/` component)
**Authors / Contributors:** Suman Halder
**Version:** 1.0
**Date:** September 2, 2026

---

## 1. Short Description

React components handling the customer-facing subscription and payment
experience: plan selection, Stripe Checkout redirect, post-payment status
polling, and the contact form for the Corporate plan. Consumes the
`/subscriptions/*` and `/contact` endpoints from the `DMAT_UserManagement_BE`
backend.

---

## 2. Files and Repository Structure

```
src/
├── App.js                               # Route definitions, auth state, protected routes
├── components/
│   ├── subscription/
│   │   ├── SubscriptionPage.jsx         # Plan comparison grid, subscribe/change/cancel actions
│   │   ├── PaymentResultPage.jsx        # Post-checkout landing page; polls /status until active
│   │   └── ContactForm.jsx              # Corporate plan enquiry form → POST /contact
│   ├── UserDropdown.jsx                 # Account menu (logout, My Subscriptions link)
│   ├── login.jsx / registration.jsx     # Auth flows (not covered by this doc)
│   └── ...
```

**Backend dependency:** the `fastapi_backend/` component of this same
repository — see `docs/subscriptions-stripe-integration.md` for the API
contract these components rely on.

---

## 3. Functional Workflow

1. **`SubscriptionPage.jsx`** fetches `/subscriptions/plans` and
   `/subscriptions/status` on load, and renders plan cards with a
   button state derived from the user's current subscription
   (`subscribe` / `upgrade` / `downgrade` / `current` / `custom`).
2. Clicking Subscribe calls `POST /subscriptions/checkout`, then does a
   **full page navigation** (`window.location.href`) to the returned
   Stripe `checkout_url` — the React app is unloaded while the user is on
   Stripe's hosted page.
3. After payment, Stripe redirects to `STRIPE_REDIRECT_URL` (backend
   config, should point at this app's `/payment-result` route).
4. **`PaymentResultPage.jsx`** reads `?payment=success|failed` from the
   URL and polls `GET /subscriptions/status` every few seconds (up to 10
   times) until the backend's webhook has activated the subscription,
   then renders the success/failure/still-processing state.
5. **`ContactForm.jsx`** posts directly to `/contact`, independent of the
   subscription flow.

---

## 4. How to Build and Run

### Environment variables required
```dotenv
REACT_APP_API_BASE_URL=http://localhost:8000 or https://login.dm-airtech.com/api     # Local backend, no trailing /subscriptions
for production  
```
For local end-to-end testing against a locally-running backend, this
**must** point at `localhost`, not the production API — otherwise checkout
requests silently hit production instead of your local server. Restart the
dev server after changing this (env vars are only read at startup).

### Local setup
```bash
npm install
npm start
```
Runs on `http://localhost:3000` by default, which must be present in the
backend's CORS `allow_origins` list (it is, by default).

### Coordinating with the backend for local testing
The backend's `STRIPE_REDIRECT_URL` must also point at
`http://localhost:3000/payment-result` for the post-payment redirect to
land back in this app rather than production — see the backend doc's
environment variable section.

---

## 5. Tests

Manual click-through only; no automated frontend tests currently exist.

- [Done] Plan grid loads and reflects current subscription status correctly
- [Done] Subscribe button redirects to a real Stripe Checkout page
- [Done] After test-card payment, lands on local `/payment-result` (not
      production) with `?payment=success`
- [Done] Cancel button on `SubscriptionPage` reflects
      `cancel_at_period_end` correctly after confirming
- [Done] Attempting to subscribe while already active shows the correct
      error toast (mapped from the backend's `409`)
- [Done] Contact form submits successfully and includes the auth header
