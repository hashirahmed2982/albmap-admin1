# AlbMap Admin Portal

Next.js 16 (App Router, TypeScript, Tailwind CSS) admin portal for AlbMap.
Talks to the same `albmap-backend` REST API as the mobile app — no
separate backend needed for this.

**This has been built and tested end-to-end**, not just written: scaffolded
with `create-next-app`, every page/component compiled with `npm run build`
(TypeScript strict mode), and the actual login → dashboard flow was
exercised against a real running `albmap-backend` + MySQL instance,
confirming the CORS configuration, response shapes, and auth flow all work
together correctly.

---

## 1. What's included

- **Login** — admin-only; a business-role account attempting to log in here is rejected client-side even if the credentials are valid
- **Dashboard** — user/business/event counts, top categories, recent approval activity
- **Businesses** — Pending Review queue (approve/reject with an optional reason sent to the owner) + All Businesses (search, filter by status, deactivate/reactivate)
- **Users** — search, ban/reactivate business accounts
- **Events** — moderate/remove events across all businesses
- **Settings** — placeholder page, see §6

Auth: JWT access + refresh tokens in cookies, with automatic silent refresh
on a 401 (mirrors the mobile app's `DioClient` interceptor pattern exactly)
and route protection via `proxy.ts` (Next.js 16's replacement for the
older `middleware.ts` convention — this project already uses the current
name, not the deprecated one).

## 2. Prerequisites — since you only have VS Code installed

You need **Node.js** installed on your machine — VS Code itself doesn't
include a JavaScript runtime, it just edits code.

1. Download Node.js from **https://nodejs.org** — get the **LTS** version (not "Current")
2. Run the installer, accept the defaults
3. Verify it worked — open VS Code's built-in terminal (**Terminal → New Terminal** in the top menu, or `` Ctrl+` `` / `` Cmd+` ``) and run:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (Node 18 or higher). If you get "command not found," restart VS Code (and your terminal) after installing Node — the PATH update sometimes needs a fresh terminal session.

You'll also need the **albmap-backend** project (from earlier) running,
plus a MySQL server it can connect to — this admin portal has nothing to
show without a live backend behind it.

## 3. Setup steps (all inside VS Code's terminal)

**Step 1 — Open the project in VS Code**
File → Open Folder → select the unzipped `albmap-admin` folder.

**Step 2 — Open a terminal inside VS Code**
Terminal → New Terminal (this opens a terminal already pointed at the project folder — no `cd` needed).

**Step 3 — Install dependencies**
```bash
npm install
```
This will take a minute or two the first time.

**Step 4 — Configure the API URL**
Copy the example env file:
```bash
cp .env.local.example .env.local
```
(On Windows, if `cp` isn't recognized, use `copy .env.local.example .env.local` instead — Command Prompt/PowerShell syntax differs from bash.)

Open the newly created `.env.local` in VS Code and confirm it points at
wherever your backend is running:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/v1
```
Leave this as-is if you're running `albmap-backend` locally on the default
port. Change it if your backend runs elsewhere.

**Step 5 — Start your backend first**
In a **separate** VS Code terminal (click the `+` icon in the terminal panel to open a second one), navigate to your `albmap-backend` folder and run:
```bash
npm run dev
```
Leave this running — you need it up the whole time you're using the admin portal.

**Step 6 — Start the admin portal**
Back in the first terminal (inside `albmap-admin`):
```bash
npm run dev
```
You should see:
```
▲ Next.js 16.2.10 (Turbopack)
- Local:  http://localhost:3000
✓ Ready in ...ms
```

**Step 7 — Open it in your browser**
Go to **http://localhost:3000** — it'll redirect you to `/login`.

**Step 8 — Log in**
Use the admin account your backend's `npm run db:seed` created — by
default:
- Email: `admin@albmap.app`
- Password: whatever you set as `SEED_ADMIN_PASSWORD` in the backend's `.env` (or the default `ChangeThisPassword123!` if you didn't change it)

## 4. Important: CORS

Your backend's `.env` needs `CORS_ALLOWED_ORIGINS` to include
`http://localhost:3000` (the admin portal's dev URL) or every API call
from this portal will be silently rejected by the browser. The backend's
`.env.example` already lists this by default:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```
If you changed that, add `http://localhost:3000` back in and restart the
backend.

## 5. Building for production

```bash
npm run build
npm start
```
`npm start` serves the production build on port 3000 by default. For an
actual deployment (Vercel, a VPS, etc.), set `NEXT_PUBLIC_API_URL` to your
backend's real deployed URL as an environment variable in whatever hosting
platform you use — `.env.local` is for local development only and isn't
included when you deploy.

## 6. What's a placeholder, not a bug

The **Settings** page is intentionally honest about what it doesn't do
yet — the backend has no endpoints for managing additional admin accounts,
email notification config, or system-wide parameters (default search
radius, editable category list, etc). Only one admin account exists
(the one `db:seed` created). Adding real settings management means adding
a new `/admin/settings` module to the backend first (same
routes/controller/service pattern as the existing admin module), then
wiring the corresponding calls here.

## 7. Project structure

```
src/
  proxy.ts                  — Route protection (Next.js 16's proxy.ts, replaces middleware.ts)
  lib/
    types.ts                — TypeScript interfaces matching the backend's exact JSON shapes
    tokens.ts                — Cookie-based JWT storage
    api.ts                    — Fetch wrapper: attaches Bearer token, auto-refreshes on 401
    admin-api.ts               — One typed function per backend endpoint
  contexts/
    AuthContext.tsx            — Login/logout, current-admin state, verifies role==='admin'
  components/
    Sidebar.tsx                 — Left nav
    StatCard.tsx                 — Dashboard metric tiles
    StatusBadge.tsx                — Colored pending/approved/rejected/active/inactive pill
    ConfirmModal.tsx                 — Reusable confirm dialog (used for approve/reject/ban/deactivate)
    ToastProvider.tsx                 — Bottom-right success/error notifications
  app/
    layout.tsx                        — Root layout, wraps AuthProvider + ToastProvider
    page.tsx                           — "/" — redirects to /dashboard or /login
    login/page.tsx                      — Login form
    (protected)/layout.tsx               — Sidebar shell + auth guard, wraps all pages below
    (protected)/dashboard/page.tsx        — Stats overview
    (protected)/businesses/page.tsx        — Approval queue + all businesses
    (protected)/users/page.tsx               — User management
    (protected)/events/page.tsx                — Event moderation
    (protected)/settings/page.tsx                — Placeholder (see §6)
```

The `(protected)` folder is a Next.js **route group** — the parentheses
mean it doesn't appear in the URL (so `/dashboard`, not
`/(protected)/dashboard`), it just lets all those pages share one layout
(the sidebar + auth check) without repeating that code on every page.

## 8. A deliberate security trade-off, stated plainly

JWTs are stored in a regular (non-`httpOnly`) cookie, readable by any
JavaScript on the page — that's what lets `lib/api.ts` attach the token to
every fetch call without needing a server-side proxy layer for every
single request. This is a reasonable trade-off for an **internal tool used
by a small trusted admin team**, but it is a real XSS exposure surface,
which is exactly why the mobile app doesn't do this (it uses OS-level
secure storage) and why a customer-facing website shouldn't either. If
this admin portal ever needs to scale beyond a small trusted team, move to
httpOnly cookies set via Next.js Route Handlers instead — that's a real
architecture change, not a config flag, so plan for it rather than
patching it in later.
