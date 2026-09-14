# User_Management — Frontend Deployment Guide

**Repository:** `User_Management` (`user_management_app/` component)
**Authors / Contributors:** Suman Halder
**Version:** 1.1
**Date:** September 2, 2026

Companion to the company-wide **DMAT HowToDeploy** guide — covers what's
specific to this repo's frontend. See `deployment-backend.md` for the
`fastapi_backend/` half of this repository and the shared production
environment table.

## Table of Contents
- [Environment Variables](#environment-variables)
- [Frontend Deployment](#frontend-deployment)
- [Nginx Routing](#nginx-routing)
- [Deploy Checklist](#deploy-checklist)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

<a id="environment-variables"></a>
## Environment Variables

Set at build time (`user_management_app/.env.production` or equivalent):
```dotenv
REACT_APP_API_BASE_URL=https://login.dm-airtech.com/api
```
This must exactly match the backend's actual public URL — a mismatch here
(e.g. pointing at a local URL in a production build, or vice versa) sends
every API call to the wrong place with no obvious error beyond failed
requests. See Troubleshooting below.

---

<a id="frontend-deployment"></a>
## Frontend Deployment

```bash
cd ~/User_Management/user_management_app
npm install
npm run build
pm2 restart user_management_frontend          # restart frontend
```

Deploy the `build/` output per the general guide's SCP/CI pattern, or via
the self-hosted GitHub Actions runner if configured for this repo.

---

<a id="nginx-routing"></a>
## Nginx Routing

Serve the build, falling through to `index.html` for client-side routing:

```nginx
location / {
    root /var/www/user_management_app/build;
    try_files $uri /index.html;
}
```

This sits alongside the `/api/` proxy block defined in
`deployment-backend.md` — both blocks belong in the same Nginx server
config for `login.dm-airtech.com`.

---

<a id="deploy-checklist"></a>
## Deploy Checklist (Frontend)

- [ ] `REACT_APP_API_BASE_URL` set to the production API URL before
      running `npm run build` (this is baked into the build at build
      time — changing the env var after building has no effect; a
      wrong value requires a full rebuild)
- [ ] Frontend rebuilt and redeployed
- [ ] Confirm the deployed build actually calls
      `https://login.dm-airtech.com/api/...` (check the Network tab
      on the live site) rather than a stale/local URL baked into an old
      build

---

<a id="rollback"></a>
## Rollback

```bash
cd ~/User_Management/user_management_app
git checkout HEAD~1
npm install
npm run build
# redeploy the build/ output
```
Since `REACT_APP_API_BASE_URL` is baked in at build time, a rollback
that changes this value requires a full rebuild — reverting the git
commit alone is not sufficient if the previous version pointed at a
different backend URL.

---

cd user_management_app
npm run build
pm2 restart user_management_frontend          # restart frontend
