# Authentication Implementation Guide for bndy Platform

## Technical Summary: Local Development Configuration

For local development, the bndy platform uses a single domain approach with different ports to ensure proper cross-domain cookie sharing:

- **Domain Structure**: All applications use `local.bndy.test` with different ports
  - Centrestage: https://local.bndy.test:3000
  - Backstage: https://local.bndy.test:3001
  - Frontstage: https://local.bndy.test:3002

- **Cookie Configuration**:
  - Cookie Domain: `local.bndy.test`
  - SameSite: `None`
  - Secure: `true`
  - HttpOnly: `true`

- **Server Configuration**:
  - Each application uses its own HTTPS server with SSL certificates
  - Server files are located at `server.mjs` in each project root

- **Centralized Configuration**:
  - All service URLs and domains are defined in `bndy-ui/src/auth/config.ts`
  - Applications should always use the exported constants from this file
  - Never hardcode URLs or domains in application code

This configuration ensures proper authentication flow between applications while maintaining compatibility with production deployment.

This document outlines the phased approach to implementing authentication across the bndy platform, ensuring seamless user experience, security, and role-based access control.

## 🔖 Phase 0: Pre-setup & Environment Readiness

**Tasks:**
- Ensure Firebase project is fully configured with authentication methods (Email/Password, Google, Facebook, Apple, Phone).
- Add domains to Firebase: `localhost`, `127.0.0.1`, `bndy.co.uk`, `*.bndy.co.uk`, `bndy.live`.
- Create Firebase roles structure in Firestore (either as a `roles` collection or embedded in `users`).
- Configure `.env.local` in `bndy-centrestage` with production Firebase keys (avoid dev/mocks).
- Confirm Firebase Admin SDK credentials are available for server routes.

**Outcome:**
- Firebase is ready for live testing from local development.
- Auth and roles reflect the real environment.

## 🔐 Phase 1: Authentication Core – bndy-centrestage

**Tasks:**
- Implement `firebaseClient.ts` in `bndy-ui` to initialize Firebase App and Auth (modular SDK).
- Create `AuthProvider` context in `bndy-ui` to track user, loading, and error states.
- Expose sign-in, sign-out, and user object via context.
- Implement Firebase login methods:
  - `signInWithPopup` for Google, Facebook, Apple.
  - `signInWithPhoneNumber` for SMS with reCAPTCHA.
  - `signInWithEmailAndPassword` and `createUserWithEmailAndPassword` for email-based auth.
- Expose hooks via `bndy-ui` like `useAuth()`.
- Add `RequireAuth` wrapper component for protected routes.

**Outcome:**
- Users can sign up/log in with email, phone, or social providers from `bndy-centrestage`.
- Auth state is reactive across the app via context.

## 🍪 Phase 2: Cross-Domain Session & SSO

**Tasks:**
- Implement `/api/sessionLogin.ts` in `bndy-centrestage` to accept Firebase ID token and convert to session cookie using Firebase Admin SDK.
- Set `Set-Cookie` header with `Domain=.bndy.co.uk; Secure; HttpOnly; SameSite=None`.
- Implement `/api/sessionLogout.ts` to clear the session cookie.
- Update `AuthProvider` to call `/api/sessionLogin` on login and `/api/sessionLogout` on logout.

**Session Cookie Attributes — What's Actually Needed?**

**Must-Have for Cross-Subdomain Auth:**

| Attribute        | Why It's Required                                      |
|------------------|-------------------------------------------------------|
| `Secure`         | Required if `SameSite=None` — enforced by Chrome & others |
| `SameSite=None`  | Required to share cookies across subdomains (e.g., `.bndy.co.uk`) |
| `HttpOnly`       | Prevents JavaScript from accessing the cookie (helps stop XSS) |

These are not optional for session cookies enabling cross-subdomain SSO.

**Browser Support & Edge Cases:**

- **Concern with `SameSite=None`:**
  - Chrome (v80+), Edge, and Safari require `Secure` to be set when using `SameSite=None`.
  - Safari (especially iOS) is known for erratic cookie behavior, particularly in WebViews or PWAs.
  - Older browsers may ignore `SameSite` entirely.
  - Some privacy-focused browsers might block third-party cookies or modify defaults.

- **Potential Problems:**
  - Authentication from an `<iframe>` or non-top-level navigation context.
  - Login via redirects landing on a different domain (e.g., `bndy.live` → `bndy.co.uk`).
  - Cookies set in HTTP responses but not available to frontend code.

**Recommendation: Use It — But Build With Resilience:**

- **Continue Using:**
  ```http
  Set-Cookie: session=...; Path=/; Domain=.bndy.co.uk; Secure; HttpOnly; SameSite=None
  ```

- **Add Safeguards:**
  - Test login behavior on key devices: Desktop Chrome, Firefox, Safari; iOS Safari (especially in PWA mode); Android Chrome; Edge (desktop/mobile).
  - **Fallback:** If the session cookie isn’t found client-side, retry token exchange using Firebase's `getIdToken()` method.
  - Don’t rely solely on cookies for auth UI — always check Firebase Auth state client-side to back up assumptions.
  - **PWA Caching Precaution:** Ensure your service worker never caches auth redirects or `/api/sessionLogin` calls. Consider bypassing service worker for any `/api/session*` paths.
  - **Monitoring:** Log cookie-related auth failures to identify problematic devices or browsers.

**TL;DR:** The specification of cookie attributes (`Secure`, `SameSite=None`, `HttpOnly`) is appropriate for secure cross-subdomain SSO with Firebase session cookies. These are necessary for compatibility with modern browser security policies. However, test behavior across devices and implement a fallback strategy using Firebase client tokens for resilience, especially on mobile Safari or embedded contexts.

**Outcome:**
- Logged-in sessions are shared across subdomains, enabling SSO between `backstage` and `frontstage`.
- Cookies persist login state even after refresh across apps.

## 🧩 Phase 3: Invite & Role Handling

**Tasks:**
- Define invite format (e.g., `https://bndy.co.uk/signup?inviteId=abc123`).
- Store invites in Firestore with fields: `id`, `email`, `bandId`, `role`, `used`, `expiresAt`.
- On sign-up, accept optional `inviteId` parameter, match invite, assign role, and add to team.
- Implement a secure server route or Firebase callable to process invites.

**Outcome:**
- New users signing up via invite are automatically assigned roles/groups.
- Existing users can be added to teams via invite links.

## 🛂 Phase 4: Role & Permission System

**Tasks:**
- Use Firestore `users/{uid}` document to store roles (e.g., `{ uid: 'abc123', roles: ['user', 'artist'], teams: ['band123'] }`).
- Create `useUserRole()` hook in `bndy-ui` for role access.
- Expose role-checking helper `canAccess(feature: 'backstage' | 'frontstage', roles: string[]): boolean`.
- Build a minimal admin panel to manually assign roles.

**Outcome:**
- Role-based UI access is enforced across apps.
- Admins can elevate users to access `backstage` or `frontstage`.

## 🔁 Phase 5: Integration in bndy-backstage and bndy-frontstage

**Tasks:**
- Reuse `AuthProvider`, `RequireAuth`, and `useUserRole()` from `bndy-ui`.
- Check for session cookie at load time.
- Redirect unauthenticated users to login on protected routes.
- Optionally preload role-based views on landing.

**UI Elements Impacted by Authentication in bndy-centrestage:**

**1. AppHeader (Visible on All Pages):**
- **Sign In/Sign Out Button:**
  - Displays "Sign In" when the user is not authenticated, directing to `/login`.
  - Displays "Sign Out" when the user is authenticated, performing a sign-out action and redirecting to the root (`/`) page.
- **User State Indicator:**
  - Indicates whether a user is logged in or not, potentially via an icon or avatar.
- **Account Access:**
  - Provides an icon or link to access the `/account` page when logged in. This icon is hidden or disabled when not authenticated.

**2. Page Access and Redirects Based on Authentication State:**
- **All Pages (General Rule):**
  - Every page must be aware of the authentication state.
  - If a user is not logged in and attempts to access a protected page, they are redirected to `/login`.
- **Specific Pages:**
  - **`/` (Root Page):** Accessible in both logged-in and logged-out states. The `AppHeader` reflects the authentication state with appropriate buttons and indicators.
  - **`/login`:** Handles both login and sign-up, including social logins. Should not be accessible if the user is already logged in; instead, redirect to `/account` or root (`/`). On successful login, redirects to `/account`.
  - **`/account`:** Only accessible when logged in. If a user attempts to access this page while not authenticated, they are redirected to `/login`.

**Navigation and Behavior Rules:**
- Users should not be able to navigate to `/login` if already authenticated. Implement a check to redirect authenticated users to `/account` or root (`/`) if they attempt to access `/login`.
- After successful login from `/login`, the user is directed to `/account`.
- After sign-out, triggered from the `AppHeader` or any other UI element, the user is redirected to the root (`/`) page.

**Outcome:**
- Auth and role-based access work consistently across all apps with shared logic.
- Session persistence and SSO function across domains.

## 🚀 Phase 6: Productionisation

**Tasks:**
- Confirm `.env.production` values are set correctly in all apps.
- Ensure domains are live and served over HTTPS (required for session cookies).
- Enforce Firebase security rules based on roles.
- Audit session cookie security (`Secure`, `SameSite=None`, `HttpOnly`).
- Set up monitoring/logging for auth errors and suspicious behavior.

**Outcome:**
- Live users can log in seamlessly.
- Invites, roles, and multi-app navigation work securely.

## 🚨 Phase 7: Error Handling for Authentication

**Tasks:**
- Implement error handling across all authentication phases to ensure user-friendly feedback and system resilience.
- Capture and handle errors at both UI and API levels, ensuring no internal errors are exposed to users.

**Error Handling Plan:**

**1. Login & Sign-Up Errors (UI-Level):**
Handled within `useAuth()` or `AuthProvider` logic in `bndy-ui` and surfaced in form UIs.

| Scenario                  | Example Error                     | Suggested UX                                      |
|---------------------------|-----------------------------------|--------------------------------------------------|
| Invalid email/password    | `auth/wrong-password`            | Show: “Incorrect email or password.”            |
| Email already in use      | `auth/email-already-in-use`      | “You already have an account — try logging in instead.” |
| Phone auth rate limited   | `auth/too-many-requests`         | “Too many login attempts. Try again later.”     |
| Popup blocked             | `auth/popup-blocked`             | “Please allow popups or try a different browser.” |
| Popup closed              | `auth/popup-closed-by-user`      | Silently ignore or “Login was cancelled.”       |

**Implementation Note:** All Firebase errors come with structured code fields. Handle them as follows:
```typescript
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (err: any) {
  if (err.code === 'auth/wrong-password') setError('Incorrect password');
}
```

**2. Session Cookie Errors (API-Level):**
Handled in `/api/sessionLogin` and `/api/sessionLogout` routes.

| Scenario                  | Response          | Action                                          |
|---------------------------|-------------------|------------------------------------------------|
| ID token invalid/expired  | 401 / JSON error  | Show “Session expired. Please log in again.” and sign out client |
| Admin SDK error           | 500               | Log to console/server but show user a generic error |

**Implementation Note:** Add error handling to `/api/sessionLogin.ts`:
```typescript
try {
  const decodedIdToken = await admin.auth().verifyIdToken(idToken);
  // success
} catch (err) {
  return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
}
```

**3. Invite Errors:**
Handled during invite parsing and account creation.

| Scenario                  | Detected By                  | UX Suggestion                                   |
|---------------------------|------------------------------|------------------------------------------------|
| Invite ID invalid         | Firestore query = not found  | “Invalid invite. Check the link or contact the sender.” |
| Invite expired            | Check `expiresAt < now()`    | “This invite has expired.”                     |
| Invite already used       | Check `used: true`           | “This invite has already been used.”           |
| Email mismatch (if enforced) | `invite.email !== user.email` | “This invite was not intended for this account.” |

**4. Role & Access Errors:**
Handled in both UI and server-side routing.

| Scenario                  | UX                                              |
|---------------------------|------------------------------------------------|
| Authenticated but lacks role | “You’re signed in, but don’t have access to this area.” |
| Role removed post-login   | Redirect and show role error                   |
| Unknown state             | Default to logout and force re-auth            |

**Implementation Note:** Ensure `RequireAuth` or `useUserRole()` hook supports a fallback or `onError()` callback.

**Suggested Implementation Enhancements:**
- **Reusable `useErrorMessage()` Hook (in `bndy-ui`):**
  ```typescript
  export function getFirebaseErrorMessage(code: string) {
    const map: Record<string, string> = {
      'auth/wrong-password': 'Incorrect email or password.',
      'auth/user-not-found': 'No account found with that email.',
      'auth/email-already-in-use': 'Email is already registered.',
      // ...
    };
    return map[code] ?? 'An unexpected error occurred. Please try again.';
  }
  ```
- **Dev Console Logging:** In dev mode, log raw errors. In prod, mask them in the UI.

**Outcome:**
- All major failure paths return user-friendly messages.
- Invite issues are clearly distinguishable.
- Session expiry results in logout + prompt, not silent breakage.
- UI never exposes Firebase internals or stack traces.

## ⚠️ Phase 8: Scalability Risks & Performance Considerations

**Tasks:**
- Address potential scalability risks and performance bottlenecks in the authentication system.
- Implement strategies to optimize costs, reduce latency, and ensure reliability across domains.

**Scalability Risks & Gaps:**

**1. Session Cookie Bloat & Invalidations:**
- Firebase ID tokens are large (~1KB), and session cookies can grow quickly.
- Long-lived cookies across subdomains may trigger issues on certain devices (e.g., Safari limits total cookie size per domain).
- Session revocation is not automatic — tokens must be revoked manually (e.g., on password reset, user role change).

**Recommendations:**
- Use Firebase session cookies, not ID tokens, in cookies to minimize size.
- Add manual revocation logic if needed (e.g., `admin.auth().revokeRefreshTokens(uid)`).
- Keep session cookies under ~4KB and avoid overloading them with user metadata.

**2. Firestore Read/Write Costs and User Lookup:**
- Multiple reads per login (e.g., user doc, role, invite validation) can incur significant costs and latency.

**Recommendations:**
- Cache user role/permissions in session cookies if they’re not sensitive.
- Use custom claims to push lightweight role info into the ID token on login to avoid extra Firestore reads:
  ```typescript
  await admin.auth().setCustomUserClaims(uid, {
    backstage: true,
    frontstage: false,
  });
  ```
  On client:
  ```typescript
  const decodedToken = await user.getIdTokenResult();
  if (decodedToken.claims.backstage) { /* allow access */ }
  ```

**3. Invite System as a Bottleneck:**
- Fetching or validating invite documents on every login, or failing to clean them up, can create performance and logic bloat.

**Recommendations:**
- Make invite processing a one-time operation, storing a flag like `inviteProcessed: true` in the user record.
- Schedule periodic cleanup of expired/used invites via Firebase Scheduled Functions.

**Performance Considerations:**

**1. Latency in Auth Checks:**
- Firebase Auth latency is low, but ID token validation (on SSR or API) involves a network fetch to Google's certs, adding ~50-150ms latency on cold requests.

**Recommendations:**
- Use Firebase session cookies for SSR instead of ID tokens.
- Cache the decoded session token on your API server with a short TTL (~5 minutes).

**2. Client Auth Initialization Delay:**
- Relying on `onAuthStateChanged()` in client apps can cause a perceived delay in detecting logged-in state on first load.

**Recommendations:**
- Hydrate the user state on initial load via session cookie, not via Firebase client re-check.
- Use SSR-authenticated API calls to preload minimal user state into page props or app context.

**3. Cross-Domain Cookie Propagation Lag:**
- Cookies don’t propagate between subdomains in real-time, especially with aggressive caching or non-HTTPS development.

**Recommendations:**
- Test login flow with `Secure; SameSite=None; Domain=.bndy.co.uk` on all target browsers.
- Ensure all requests are behind HTTPS and avoid localhost hacks in production.

**Summary of Recommendations:**

| Area                  | Recommendation                                      |
|-----------------------|----------------------------------------------------|
| Session Bloat         | Use session cookies, don’t store extra metadata.   |
| Role Checks           | Use custom claims where possible.                 |
| Invite Scale          | Process invites once, then clean them up.         |
| SSR Performance       | Cache decoded sessions on server with short TTL.  |
| Client Load Speed     | Avoid `onAuthStateChanged` lag; hydrate session early. |
| Cross-Domain Latency  | Standardize on `*.bndy.co.uk` with HTTPS for everything. |

**Outcome:**
- Scalability risks are mitigated with efficient use of session cookies and Firestore operations.
- Performance bottlenecks are addressed through caching, hydration, and streamlined auth checks.
- Cross-domain consistency is ensured with proper cookie settings and HTTPS enforcement.

## 🧪 Optional: Developer QA Checklist

| Check                                      | Result |
|--------------------------------------------|--------|
| Can login with Google/Facebook/Apple/SMS   | ✅     |
| Can accept invite and be added to a team   | ✅     |
| Can sign out and clear session cookie      | ✅     |
| Can access backstage/frontstage with correct role | ✅     |
| Auth persists across tabs and subdomains   | ✅     |
| Production deployment uses live Firebase   | ✅     |