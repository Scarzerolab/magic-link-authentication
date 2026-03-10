# Frontend — Authentication with Magic Link (Email OTP)

This Next.js frontend handles user authentication using [Magic SDK](https://magic.link/) with a custom Email OTP flow. After a successful login, the Magic-issued **DID Token** is forwarded to the backend, which verifies it and issues a standard **JWT session**.

---

## How the Auth Flow Works

### 1. User Enters Their Email (`/src/components/auth.tsx`)

The user submits their email address. Under the hood, `magic.auth.loginWithEmailOTP()` is called with `showUI: false` — this suppresses Magic's default popup UI so we can drive a fully custom experience.

```ts
const handle = magic.auth.loginWithEmailOTP({ email, showUI: false });
```

Magic sends a 6-digit OTP to the user's inbox and fires an `email-otp-sent` event when done. The component listens for this event and swaps the UI to show the OTP input step.

---

### 2. User Submits the OTP

The user enters the 6-digit code. This code is passed back to the active Magic process via an event emitter:

```ts
magicHandle.emit('verify-email-otp', otp);
```

Magic validates the code against its servers. If the code is wrong, an `invalid-email-otp` event is fired and an error is shown to the user.

---

### 3. Login Resolves — DID Token Issued

Once the OTP is verified, the `handle.then()` callback receives a **DID Token** (`didToken`) — a signed, short-lived proof-of-identity issued by Magic.

```ts
handle.then((didToken: string | null) => {
  // User is authenticated — send didToken to your backend
  router.push('/successPage');
});
```

---

### 4. Backend Verification & JWT Session

The DID Token should be sent to your backend API on the first authenticated request. The backend then:

1. **Verifies the DID Token** using Magic's Admin SDK (`@magic-sdk/admin`):
   ```ts
   magic.token.validate(didToken);
   const userMetadata = await magic.users.getMetadataByToken(didToken);
   ```

2. **Creates a JWT session** for the user (using the verified email/issuer from Magic's metadata) and returns it as a cookie or response header.

3. All subsequent requests use the JWT — not the DID Token — for authentication.

> The DID Token is short-lived (~15 minutes) and is only used once at login to bootstrap a longer-lived server-side JWT session.

---

## Key Files

| File | Purpose |
|---|---|
| `src/providers/MagicProvider.tsx` | Initializes the Magic SDK instance and exposes it via React context |
| `src/components/auth.tsx` | Custom Email OTP login UI (2-step: email → OTP) |
| `src/app/callback/page.tsx` | OAuth2 redirect callback handler (for future OAuth providers) |
| `src/app/successPage/page.tsx` | Post-login dashboard — shows wallet and session metadata |
| `src/components/walletDisplay.tsx` | Displays the user's Magic-generated wallet address and ETH balance |
| `src/components/metadataDisplay.tsx` | Displays Magic session metadata (email, DID, active DID Token) |
| `src/hooks/useEthers.ts` | Wraps Magic's RPC provider with Ethers.js for blockchain interaction |

---

## Wallet & Blockchain

Magic automatically provisions a non-custodial wallet for each user. This app connects to the **XDC Network** (testnet, Chain ID `51`) via Ankr's public RPC:

```ts
network: {
  rpcUrl: "https://rpc.ankr.com/xdc",
  chainId: 51,
}
```

The wallet address and ETH balance are read using Ethers.js v5 via the `useEthers` hook.

---

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_MAGIC_API_KEY=your_magic_publishable_key_here
```

Get your key from the [Magic Dashboard](https://dashboard.magic.link/).

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the login page.