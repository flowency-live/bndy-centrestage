# Authentication Implementation Checklist

## Phase 0: Pre-setup & Environment Readiness
- [x] Confirm Firebase project configuration with all authentication methods:
  - [x] Email/Password
  - [x] Google
  - [x] Facebook
  - [x] Apple
  - [x] Phone
- [x] Verify domains added to Firebase:
  - [x] localhost
  - [x] 127.0.0.1
  - [x] bndy.co.uk
  - [x] *.bndy.co.uk
  - [x] bndy.live
- [x] Create Firebase roles structure in Firestore
- [x] Configure `.env.local` in `bndy-centrestage` with production Firebase keys
- [x] Confirm Firebase Admin SDK credentials are available for server routes

## Phase 1: Authentication Core – bndy-centrestage
- [x] Implement `firebaseClient.ts` in `bndy-ui` with Firebase App and Auth initialization
- [x] Create `AuthProvider` context in `bndy-ui` to track:
  - [x] User state
  - [x] Loading state
  - [x] Error state
- [x] Expose authentication methods via context:
  - [x] Sign-in
  - [x] Sign-out
  - [x] User object
- [x] Implement Firebase login methods:
  - [x] `signInWithPopup` for Google, Facebook, Apple
  - [x] `signInWithPhoneNumber` for SMS with reCAPTCHA
  - [x] `signInWithEmailAndPassword` for email login
  - [x] `createUserWithEmailAndPassword` for email registration
- [x] Create and expose `useAuth()` hook via `bndy-ui`
- [x] Add `RequireAuth` wrapper component for protected routes

## Phase 2: Cross-Domain Session & SSO
- [x] Implement `/api/sessionLogin.ts` in `bndy-centrestage`:
  - [x] Accept Firebase ID token
  - [x] Convert to session cookie using Firebase Admin SDK
  - [x] Set cookie with proper attributes:
    - [x] Domain=.bndy.co.uk
    - [x] Secure
    - [x] HttpOnly
    - [x] SameSite=None
- [x] Implement `/api/sessionLogout.ts` to clear session cookie
- [x] Update `AuthProvider` to:
  - [x] Call `/api/sessionLogin` on successful login
  - [x] Call `/api/sessionLogout` on logout
- [x] Test session persistence across subdomains
- [x] Implement fallback mechanisms for cookie issues

## TODO: Phase 3: Invite & Role Handling
- [ ] Define invite format (e.g., `https://bndy.co.uk/signup?inviteId=abc123`)
- [ ] Create Firestore structure for invites with fields:
  - [ ] id
  - [ ] email
  - [ ] bandId
  - [ ] role
  - [ ] used
  - [ ] expiresAt
- [x] Implement user role assignment on sign-up:
  - [x] Automatically add new users to Firestore with 'user' role
  - [x] Update user's last login timestamp on sign-in
- [ ] Implement invite processing on sign-up:
  - [ ] Accept optional `inviteId` parameter
  - [ ] Match invite to user
  - [ ] Assign appropriate role
  - [ ] Add user to team
- [ ] Create secure server route or Firebase callable function for invite processing

## Phase 4: Role & Permission System
- [x] Set up Firestore `users/{uid}` document structure for roles:
  - [x] `roles` array (e.g., `['user', 'artist']`)
  - [ ] `teams` array (e.g., `['band123']`)
- [ ] Create `useUserRole()` hook in `bndy-ui`
- [ ] Implement role-checking helper:
  - [ ] `canAccess(feature: 'backstage' | 'frontstage', roles: string[]): boolean`
- [x] Build minimal admin panel for manual role assignment

## Phase 5: UI Integration in bndy-centrestage
- [x] Update `AppHeader` components:
  - [x] Sign In/Sign Out button based on auth state
  - [x] User state indicator (icon/avatar)
  - [x] Account access link when logged in
- [x] Implement page access controls:
  - [x] Root page (`/`): Accessible in both states
  - [x] Login page (`/login`): Redirect to `/account` if already logged in
  - [x] Account page (`/account`): Redirect to `/login` if not authenticated
- [x] Set up navigation rules:
  - [x] Redirect authenticated users from `/login` to `/account`
  - [x] Redirect to root (`/`) after sign-out
- [x] Implement authentication UI:
  - [x] Login form with email/password authentication
  - [x] Signup form with email/password registration
  - [x] Social login buttons (Google, Facebook, Apple)
  - [x] Error handling for authentication failures

## Phase 6: Productionisation
- [ ] Confirm `.env.production` values in all apps
- [ ] Verify domains are live and served over HTTPS
- [ ] Implement Firebase security rules based on roles
- [ ] Audit session cookie security
- [ ] Set up monitoring/logging for auth errors

## Phase 7: Error Handling
- [x] Implement UI-level error handling for common auth errors:
  - [x] Invalid email/password: "Incorrect email or password"
  - [x] Email already in use: "You already have an account — try logging in instead"
  - [x] Phone auth rate limited: "Too many login attempts. Try again later"
  - [x] Popup blocked: "Please allow popups or try a different browser"
  - [x] Popup closed: Silently ignore or "Login was cancelled"
- [x] Implement API-level error handling in session routes:
  - [x] ID token invalid/expired: 401 response with appropriate message
  - [x] Admin SDK error: 500 response with generic error message
- [x] Add custom claims for lightweight role info in ID token

## Refactor Phase Tasks
- [x] Centralize user creation logic in auth-context.tsx
  - [x] Move Firestore operations out of UI components
  - [x] Implement createOrUpdateUserRecord function with proper error handling
  - [x] Use useEffect with user?.uid dependency to avoid race conditions
- [x] Standardize cookie handling across applications
  - [x] Use consistent cookie attributes (httpOnly, secure, sameSite, domain)
  - [x] Set up proper .env variables for COOKIE_DOMAIN
- [x] Improve session verification
  - [x] Enhance /api/sessionCheck endpoint
  - [x] Ensure session cookie is set before attempting Firestore writes
- [x] Maintain proper separation between client and server auth
  - [x] Use cookies for server requests (API routes)
  - [x] Use Firebase client auth state for local UI
  - [x] Keep session cookies HttpOnly

## Auth v User Refactor Phase Tasks

- [x] Create separate UserDataContext for Firestore user data
  - [x] Create new context file in bndy-ui for user profile data
  - [x] Define UserProfile interface with Firestore fields (roles, etc.)
  - [x] Implement UserDataProvider with proper loading states
  - [x] Create useUserData hook for accessing profile data

- [x] Refactor AuthContext to focus solely on authentication
  - [x] Remove Firestore operations from auth-context.tsx
  - [x] Remove processedUserIds Set and related logic
  - [x] Keep currentUser limited to Firebase Auth user data only
  - [x] Move createOrUpdateUserRecord to UserDataContext

- [x] Implement proper data flow between contexts
  - [x] Make UserDataProvider depend on AuthContext for user ID
  - [x] Fetch user profile data when auth state changes
  - [x] Handle loading/error states appropriately
  - [x] Implement proper cleanup on logout

- [x] Update session management to work with separated contexts
  - [x] Ensure session login/logout still functions correctly
  - [x] Update providers in all applications (centrestage, backstage)
  - [x] Test cross-domain SSO with the new implementation

- [x] Add comprehensive documentation
  - [x] Document the separation of concerns
  - [x] Update comments in code to reflect the new architecture
  - [x] Add usage examples for both contexts