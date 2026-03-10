# Magic Link Email OTP — Full-Stack Auth Demo

This project is a full-stack demo of a **production-grade authentication system** built with Magic Link's Email OTP. It demonstrates the complete journey from a first-time login all the way to silent session persistence — the kind of "just stays logged in" experience users expect from modern web apps.

**Stack:** Next.js (frontend) · Express.js (backend)

---

## What This Demo Shows

Most auth tutorials stop at "the user is logged in." This demo goes further — it shows what happens *after* the login: how a secure session is created, stored safely in the browser, and silently re-used so the user never has to log in again until their session expires.

---

## The Full Auth Flow

### Step 1 — The Initial Login *(happens once)*

The user opens the app, types in their email, and receives a 6-digit OTP from Magic. After entering the code, Magic's SDK verifies it against Magic's servers and returns a short-lived **DID Token** to the frontend.

```
User → types email → receives OTP → enters OTP
                                         ↓
                              Magic SDK returns DID Token
                                         ↓
                         Frontend POSTs DID Token to Express backend
```

> The DID Token is a signed, tamper-proof credential. Think of it as a one-time passport — it proves the user owns that email address, but it expires in ~15 minutes and is only useful once.

---

### Step 2 — Minting and Baking the Cookie *(the backend's job)*

The Express backend receives the DID Token and does two things:

1. **Verifies the DID Token** using Magic's Admin SDK to confirm it's genuine and unexpired.
2. **Mints a custom 3-day JWT** containing the user's identity (email, issuer DID, etc.) and signs it with a secret only the server knows.

Instead of sending this JWT back as a JSON response for React to store, the backend writes it directly into the browser as an **`HttpOnly` cookie**.

```
Express receives DID Token
        ↓
magic.token.validate(didToken)  ← confirms it's real
        ↓
Signs a 3-day JWT with server secret
        ↓
Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict
```

#### Why `HttpOnly`?

This is the critical security decision. A regular cookie or `localStorage` token can be read by any JavaScript running on the page — including malicious scripts from browser extensions or XSS attacks. An `HttpOnly` cookie is **locked inside the browser's internal vault**. JavaScript on the page cannot touch it. Only the browser itself can read it, and it only sends it to your server.

---

### Step 3 — The Silent Handshake *(the "remembering" part)*

The next day, the user types `localhost:3000` into their browser. They haven't touched the app in 24 hours. Here's what happens before the page even renders:

```
Browser navigates to localhost:3000
        ↓
Browser automatically attaches the HttpOnly cookie to the request
        ↓
Next.js receives the request — with the session cookie already attached
```

The user did nothing. The browser handled this automatically. This is how cookies work — the browser is contractually obligated to send them back to the domain that set them, on every request, silently.

---

### Step 4 — Bypassing the Login Screen *(the "remembering" part)*

Next.js intercepts the incoming request in `middleware.ts` *before* any page renders:

```
Request arrives at Next.js middleware
        ↓
Middleware reads the HttpOnly cookie from the request headers
        ↓
Verifies the JWT signature and checks expiry
        ↓
    [Valid]                         [Invalid / Missing]
      ↓                                     ↓
Redirect to /successPage           Let the request through
(user never sees login screen)     (Auth component renders normally)
```

If the 3-day JWT is still valid, the user is instantly routed to `/successPage`. The `<Auth />` component never mounts. Magic Link is never contacted. The whole session check happens in milliseconds on the server before a single byte of UI is sent to the browser.

---

## Architecture Overview

```
┌─────────────────────────────────┐      ┌─────────────────────────────┐
│         Next.js Frontend        │      │       Express Backend        │
│                                 │      │                              │
│  middleware.ts                  │      │  POST /auth/login            │
│  └─ checks HttpOnly cookie      │      │  └─ validates DID Token      │
│     on every request            │      │  └─ mints 3-day JWT          │
│                                 │      │  └─ sets HttpOnly cookie     │
│  /src/components/auth.tsx       │      │                              │
│  └─ Email OTP via Magic SDK     │─────▶│  GET /auth/me                │
│  └─ POSTs DID Token to backend  │      │  └─ reads cookie             │
│                                 │      │  └─ returns user info        │
│  /successPage                   │      │                              │
│  └─ wallet + session metadata   │      │                              │
└─────────────────────────────────┘      └─────────────────────────────┘
         │                                           │
         └──────── HttpOnly Cookie ─────────────────┘
                  (browser manages automatically)
```

---

## Token Lifecycle

| Token | Issued by | Lifespan | Stored in | Purpose |
|---|---|---|---|---|
| DID Token | Magic SDK (client) | ~15 minutes | Memory only | Prove identity to your backend once |
| JWT Session | Express backend | 3 days | HttpOnly Cookie | Maintain session across requests |

Once the JWT is issued, the DID Token is discarded. Magic Link is not involved in any subsequent requests during the 3-day session.

---

## Security Properties

- **No tokens in `localStorage`** — immune to XSS token theft
- **No tokens in JavaScript-readable cookies** — immune to rogue extension attacks
- **JWT signed server-side** — cannot be forged without the server secret
- **Magic verifies email ownership** — no passwords to leak or brute-force
- **`SameSite=Strict`** — cookie is not sent on cross-site requests, blocking CSRF

---

## Project Structure

```
/
├── frontend/                   # Next.js app
│   └── src/
│       ├── middleware.ts        # Session gate — checks cookie before page loads
│       ├── app/
│       │   ├── page.tsx         # Login page (only rendered if no valid session)
│       │   └── successPage/     # Protected page
│       ├── components/
│       │   └── auth.tsx         # Magic Email OTP UI
│       └── providers/
│           └── MagicProvider.tsx
│
└── backend/                    # Express app
    └── src/
        ├── routes/auth.ts       # /auth/login — verifies DID Token, sets cookie
        └── middleware/session.ts # JWT verification middleware for protected routes
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Magic Link account](https://dashboard.magic.link/) — grab your **Publishable Key** and **Secret Key**

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Add NEXT_PUBLIC_MAGIC_API_KEY to .env.local
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env
# Add MAGIC_SECRET_KEY and JWT_SECRET to .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any email address to see the full flow in action.