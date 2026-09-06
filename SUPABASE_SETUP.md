# ⚡ Connect ClearVault to Supabase — Step-by-Step (≈15 min)

Your app is **already Supabase-ready**. The backend picks its database at boot:

- `.env` **has** Supabase keys → runs on **PostgreSQL (Supabase)**
- `.env` **empty/missing** → runs on the local JSON store (current demo mode)

**Nothing in the frontend changes.** Follow the steps top to bottom.

---

## Step 1 — Create a Supabase project (free)  *(3 min)*

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub/email.
2. Click **New project** and fill in:
   - **Name:** `clearvault`
   - **Database password:** click *Generate* and **save it somewhere** (you won't need it for this guide, but keep it)
   - **Region:** **Mumbai (ap-south-1)** — closest to you, fastest
3. Click **Create new project** and wait ~2 minutes while it provisions.

## Step 2 — Get your two keys  *(1 min)*

In the left sidebar: **⚙ Project Settings → API**. You need exactly two values:

| What | Where to find it | Also called |
|---|---|---|
| **Project URL** | top of the page → `Project URL` | `https://abcdefgh.supabase.co` |
| **Service role key** | `Project API keys` → `service_role` (click **Reveal**) | starts with `eyJhbGci...` |

> ⚠️ **Use the `service_role` key, not the `anon` key.** The service key stays on your
> backend only — it can do anything to the database, which is exactly why the frontend
> never sees it. (`anon` gets hard-denied by our RLS setup anyway.)

## Step 3 — Create the tables  *(2 min)*

1. Left sidebar → **SQL Editor** → **+ New query**.
2. Open **`backend/supabase/schema.sql`** from this repo, copy the *entire file*, paste it in.
3. Click **Run** (or Ctrl+Enter). You should see **"Success. No rows returned"**.
4. Check the left sidebar → **Table Editor**: you'll have `departments`, `profiles`,
   `clearance_requests`, `clearances`, `notifications`, `audit_log` — with `departments`
   already containing the 4 departments.

## Step 4 — Point your backend at Supabase  *(1 min)*

```bash
cd no-dues-system/backend
cp .env.example .env
```

Open `backend/.env` and paste your keys from Step 2:

```ini
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...long...key
SIGNING_SECRET=any-long-random-string-you-make-up   # e.g. run: openssl rand -hex 32
```

## Step 5 — Seed the demo data  *(1 min)*

```bash
cd backend
npm install      # first time only, to get @supabase/supabase-js
npm run seed
```

Expected output:

```
✔ created STUDENT Ananya Verma <ananya@campus.edu>
✔ created STAFF   Meera Krishnan <library@campus.edu>
...
✔ demo history seeded (1 completed certificate + 1 in-progress request)
```

*(Running `npm run seed` twice is safe — it skips what already exists.)*

## Step 6 — Start and verify  *(2 min)*

```bash
# terminal 1
cd backend && npm run start
```

Watch the startup log — it must say:

```
[store] data layer → SUPABASE (PostgreSQL)     ← ✅ you're live on Supabase
[api] ClearVault backend → http://0.0.0.0:4000
```

```bash
# terminal 2
cd frontend && npm run dev        # → http://localhost:5173
```

Now prove it end-to-end:

1. Sign in as **ananya@campus.edu / student123** → raise a clearance request.
2. **Open a new tab → Supabase → Table Editor → `clearance_requests`** —
   your request is sitting there, in real Postgres. 🎉
3. Sign in as **library@campus.edu**, approve → refresh the `clearances` table and
   see the `APPROVED` row with its `signature_hash`.
4. Restart the backend — **all data survives** (unlike the JSON demo).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Boot log says `local JSON file` | `.env` missing/empty keys, or you edited `.env.example` instead of copying it to `.env` |
| `[supabase] Invalid API key` | You pasted the `anon` key — use **service_role** from Settings → API |
| `[supabase] relation "profiles" does not exist` | Step 3 skipped — run `schema.sql` in the SQL Editor |
| Seed says `permission denied for table profiles` | Same cause: anon key instead of service_role |
| Certificates/signatures mismatch after cutover | `SIGNING_SECRET` changed between issues. Set it once in production and never change it |
| Went back to demo mode | Delete/empty the two values in `.env` and restart |

## How it works under the hood (for your viva)

- `backend/src/store.js` is a **dispatcher**: at boot it checks for the Supabase env vars
  and imports either `store.supabase.js` or `store.json.js`. Both files export the *exact
  same async functions* (`findUserByEmail`, `deptQueue`, `decide`, `verifyCertificate`…),
  so routes (`backend/src/routes/*`) don't know or care which database is underneath.
- The backend connects with the **service role**, which bypasses Row Level Security.
  All authorization (students see only their own file, staff only their own department)
  is enforced by your Express middleware — unchanged.
- RLS is **enabled with zero policies** on every table (`schema.sql` bottom): even if
  your `anon` key leaked, a browser calling Supabase directly gets nothing.
- The public QR-verify route (`/api/verify/:code`) reads only through the backend too.

## Deploying later (optional)

- **Backend** → Render/Railway: build `npm install`, start `npm run start`, add the 3 env
  vars in their dashboard. Set `PORT` if they require it.
- **Frontend** → Vercel/Netlify: `cd frontend && npm run build`, publish `dist/`.
  Change the Vite proxy target to your deployed backend URL, or set a base-URL env in `src/api.js`.
- Keep `SIGNING_SECRET` identical between dev and prod so certificates verify everywhere.
