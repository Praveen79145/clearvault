# ClearVault — Automated No-Dues & Digital Clearance

Digital Campus Governance · one request → four parallel departmental sign-offs → a
cryptographically verifiable **Certificate of No Dues**.

## Repository layout

```
no-dues-system/
├── frontend/                 # Vite + React + Tailwind v4 (port 5173)
│   ├── index.html
│   ├── vite.config.js        # dev server proxies /api → localhost:4000
│   └── src/
│       ├── theme.css         # design tokens + components (paper/ink themes)
│       ├── icons.jsx         # hand-placed stroke icon set (no emoji)
│       ├── api.js            # fetch wrapper + date helpers
│       ├── components/       # Logo, Shell (topbar + notifications), ThemeToggle
│       └── pages/            # Landing, Login, Student, Staff, Admin, Certificate, Verify
├── backend/                  # Express API (port 4000)
│   ├── src/
│   │   ├── index.js          # app wiring
│   │   ├── store.js          # JSON-file store (data/db.json) — tables mirror schema.sql
│   │   ├── auth.js           # HMAC session cookies + role guards
│   │   ├── sign.js           # HMAC-SHA256 digital signatures
│   │   └── routes/           # auth · requests · dept · notifications · admin · verify
│   └── data/db.json          # persisted demo data (delete to reseed)
└── README.md
```

## Run

```bash
# terminal 1
cd backend && npm install && npm run start      # API on :4000
# terminal 2
cd frontend && npm install && npm run dev       # app on :5173 (proxies /api)
```

Reset demo data: `rm backend/data/db.json` and restart the API (it reseeds).

> **⚡ Supabase (PostgreSQL):** backend is pre-wired — see **SUPABASE_SETUP.md**.
> **🔑 Google Sign-In (RGUKT students):** full OAuth flow implemented —
> `^r[0-9]{6}@rguktrkv\.ac\.in$` enforced server-side. Configure in **GOOGLE_SETUP.md**.
> Policy tests: `cd backend && npm run test:auth` (14 checks).

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | ananya@campus.edu | student123 |
| Library / Hostels / Sports / Accounts | `<dept>@campus.edu` | staff123 |
| Administrator | admin@campus.edu | admin123 |

## Judge walkthrough (~3 min)

1. Sign in as **Ananya** → *Raise a clearance request* → watch the four-segment tracker
2. Sign in as **Library** (`/staff`) → **Approve & sign** — an HMAC signature appears
3. Sign in as **Accounts** → **Return for dues** with the remark “fee instalment pending”
4. Ananya's tracker shows the banner + remark instantly → **Re-apply** (Accounts only)
5. **Accounts approves** → certificate auto-issues → open it → **Print / Save as PDF**
6. Scan the certificate's QR → public verification page lists all four signatures
7. Try `/verify/FAKE-123` → **Not in the registry** (forgery detection)
8. **Admin** (`/admin`) → KPI strip, department load, append-only audit trail

## Security notes

- Sessions: `userId.timestamp.HMAC` httpOnly cookies; every API route enforces role server-side
  (students cannot reach staff/admin endpoints; staff cannot act outside their department)
- Signatures: `HMAC-SHA256(rollNo | dept | signedAt)` — printed on the certificate; the public
  `/api/verify/:code` endpoint recomputes truth from the registry
- Rejection requires remarks; double-decision and re-apply-before-rejection are rejected (400)

## Production path

- Swap `backend/src/store.js` for Postgres (Supabase/Neon) — table shapes are already 1:1
- Email hooks: call your mailer from `notify()` in `store.js`
- Deploy: frontend static build on any CDN; backend on any Node host; set `SIGNING_SECRET`
