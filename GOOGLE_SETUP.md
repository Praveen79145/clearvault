# 🔑 Google Sign-In Setup — Step-by-Step (≈10 min, no domain needed)

The full OAuth flow is **already implemented**. You only need to create a Google
OAuth client and paste two values into `backend/.env`.

**Sign-in policy enforced on the server:**
Google identity verified → `email_verified` true → email matches `^r[0-9]{6}@rguktrkv\.ac\.in$`
→ studentId extracted (`r220246`) → existing session cookie created → `/student`.

---

## Step 1 — Create the Google Cloud project

1. Go to **https://console.cloud.google.com** → sign in with any Google account.
2. Top bar → project picker → **New Project** → name it `clearvault` → **Create**.

## Step 2 — Configure the OAuth consent screen

1. Left menu → **APIs & Services → OAuth consent screen** → **Get started**.
2. App name: `ClearVault` · User support email: your Gmail → **Next**.
3. Audience: **External** → **Next** → contact info → **Create**.
4. (While in testing mode, only accounts you list under **Audience → Test users**
   can sign in. Add the Google accounts you'll demo with — e.g. your `rXXXXXX@rguktrkv.ac.in`
   test Workspace account — or click **Publish app** to allow anyone.)

## Step 3 — Create the OAuth client (type: **Web application**)

1. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**.
2. **Application type: `Web application`** ← important (server-side flow, keeps the secret safe).
3. Name: `clearvault-backend`.
4. **Authorized JavaScript origins** → add:
   ```
   http://localhost:5173
   http://localhost:4000
   ```
5. **Authorized redirect URIs** → add **exactly**:
   ```
   http://localhost:4000/api/auth/google/callback
   ```
6. **Create** → copy the **Client ID** and **Client Secret** from the dialog.

## Step 4 — Add them to the backend

```bash
cd no-dues-system/backend
cp .env.example .env      # if you haven't already
```

Edit `backend/.env`:

```env
GOOGLE_CLIENT_ID=104xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173
```

> 🔒 The client secret is read **only** by Express. It never reaches the browser.

## Step 5 — Run and test

```bash
cd backend  && npm run start     # API → :4000
cd frontend && npm run dev       # app → :5173
```

1. Open `http://localhost:5173/login` → **Continue with Google**.
2. Google shows its real **account chooser** (`prompt=select_account` is forced), even if you're already signed in.
3. Pick your RGUKT-format account → you're provisioned (first time) and land on `/student`.
4. Pick a `@gmail.com` account → back on the login page with:
   *"Please sign in using your RGUKT student Google account… You chose: …@gmail.com"*
   and a **Choose a different account** button.

Verify policy logic any time without Google: `cd backend && npm run test:auth` (14 tests).

---

## Production differences

| Setting | Local | Production |
|---|---|---|
| Redirect URI in Google console | `http://localhost:4000/api/auth/google/callback` | `https://api.yourapp.com/api/auth/google/callback` |
| JS origins | `http://localhost:5173` | `https://yourapp.com` |
| `GOOGLE_CALLBACK_URL` / `BACKEND_URL` | localhost | your real backend URL |
| `FRONTEND_URL` | localhost | your real frontend URL |
| Consent screen | Testing (test users only) | **Publish app** |
| Cookie `Secure` flag | off (http localhost) | add when serving over HTTPS |

⚠️ **Same-domain note:** sessions use host-only cookies. For hosted demos, keep frontend
and backend on the same parent domain (e.g. `app…` + `api…` with cookie `Domain=.yourapp.com`)
or serve `/api` from the same origin via reverse proxy — exactly like the local Vite proxy does.

## The whole flow (what happens on click)

```
/login → [Continue with Google]
  → backend /api/auth/google      (sets state cookie, 302 → Google, prompt=select_account)
  → Google account chooser → Google auth
  → backend /api/auth/google/callback
        ├─ error=access_denied               → /login?oauth=cancelled
        ├─ state ≠ cookie                    → /login?oauth=invalid_state
        ├─ code → tokens (client_secret)     → exchange_failed on failure
        ├─ verify ID token w/ Google         → invalid_token (expired/tampered/wrong aud/iss)
        ├─ email_verified?                   → unverified_email
        ├─ /^r[0-9]{6}@rguktrkv\.ac\.in$/    → not_rgukt  (+ shows the email tried)
        ├─ upsert student (store/Supabase)   → server_error on DB failure
        └─ HMAC session cookie → 302 → FRONTEND_URL/student  ✅
```
