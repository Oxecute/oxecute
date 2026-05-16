# Auth Architecture Audit: Next.js 14 + Supabase + Vercel

**Date:** May 14, 2026 | **Status:** Deployed to Vercel with custom domain (oxecute.com → www.oxecute.com)

---

## ✅ VALIDATION: Current Architecture (CORRECT)

### 1. **OAuth PKCE Cookie Host Matching** ⭐ Critical
- **`client.ts`**: Uses `getBrowserOAuthOrigin()` → `window.location.origin` (not forced to apex/www)
  - ✅ PKCE cookie set on same host browser is visiting
  - ✅ `Domain=.oxecute.com` env var enables cookie sharing across apex↔www via Vercel's 307
  - ✅ Avoids "code verifier not found" when apex/www don't share cookies
- **Action:** Vercel env must include: `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.oxecute.com`

### 2. **Auth Callback Route** ✅
- **`src/app/auth/callback/route.ts`**:
  - ✅ Creates `NextResponse.redirect()` **before** calling `exchangeCodeForSession`
  - ✅ `setAll()` attaches session cookies to response headers via `forNextSetCookie()`
  - ✅ Catches OAuth errors and redirects with `auth_error` query param
  - ✅ Validates `code` param and sanitizes `next` target
  - ✅ Cleans up `oxecute_pw_reset_intent` cookie after exchange

### 3. **Middleware OAuth Redirect** ✅
- **`src/middleware.ts`**:
  - ✅ Catches Supabase sending `/?code=...` to root instead of `/auth/callback`
  - ✅ Redirects **same hostname** (307) → `/auth/callback?code=...` (avoids redirect loop)
  - ✅ Preserves single-segment routes for username rewrites (`/u/[username]`)
  - ✅ Uses `getAll()` instead of deprecated `get/set/remove`

### 4. **Server & Browser Cookie Handlers** ✅
- **`server.ts`**: Wraps `cookieStore.set()` in try/catch for read-only contexts
- **`client.ts`**: Optional `Domain=.oxecute.com` to share PKCE cookies across subdomain redirect
- **`for-next-cookie.ts`**: Strips invalid cookie fields before Next.js serialization

### 5. **OAuth Configuration Flow** ✅
- **`lib/auth/oauth.ts`** + **`lib/site-url.ts`**:
  - ✅ `oauthRedirectUrl()` builds `/auth/callback?next=...` using browser origin
  - ✅ `getBrowserOAuthOrigin()` returns `window.location.origin` (not env-forced)
  - ✅ `getPublicSiteOrigin()` (unused for OAuth but available for emails/links)

### 6. **Session Persistence** ✅
- **`AuthenticatedShell.tsx`**:
  - ✅ Calls `supabase.auth.getSession()` on mount
  - ✅ Redirects to `/login` if no session
  - ✅ Fetches `/api/me` to validate profile completion
  - ✅ Redirects incomplete profiles to `/start`
- **`login/page.tsx`**:
  - ✅ Uses `signInWithPassword` + `getUser()` to sync cookies
  - ✅ Checks `/api/me` to route to `/dashboard` or `/start` based on `execution_count`
  - ✅ Cleans auth errors from URL with `history.replaceState()`

### 7. **Supabase Configuration** ✅
- **`Site URL`:** `https://www.oxecute.com` (matches Vercel prod host)
- **`Redirect URLs`:** Include `localhost:3000/auth/callback`, `*.vercel.app/auth/callback`, `https://oxecute.com/auth/callback`, `https://www.oxecute.com/auth/callback`
- **`OAuth Providers`** (Google):
  - JS origins: `http://localhost:3000`, `*.vercel.app`, `oxecute.com`, `www.oxecute.com`
  - Redirect URI: `https://<your-project>.supabase.co/auth/v1/callback` (single Supabase endpoint)

---

## ⚠️ REMAINING FAILURE MODES

### **Priority 1: HIGH — Silent Auth Failures**

#### 1A. Cookie Secure Flag on HTTP/Preview Deploys
**Failure:** Browser blocks `Secure` cookies on `http://` origins
```
Error: Cookie fails to set on localhost (Secure + http mismatch)
```
**Current State:** `secure: true` hardcoded in `client.ts`
**Fix Needed:**
```typescript
// client.ts - detect environment
const isSecure = typeof window !== 'undefined' 
  ? window.location.protocol === 'https:' 
  : true;
cookieOptions: {
  secure: isSecure,  // ← Allow http:// on localhost/preview
  // ...
}
```

#### 1B. SameSite=Lax + Cross-Origin Cookie Issues (Brave/Safari/Private Mode)
**Failure:** Cookies set during OAuth callback but not sent to next fetch
- `SameSite=Lax` blocks **first-party** cookies on top-level navigation from Supabase
- Affects: Brave (shield rules), Safari (ITP 2.0+), Firefox (enhanced tracking), private windows
- User sees: "No session" despite cookies being set

**Current State:** `sameSite: "lax"` in both `client.ts` and Supabase defaults
**Diagnosis:**
```javascript
// Add to AuthenticatedShell.tsx for visibility
useEffect(() => {
  const cookies = document.cookie;
  authDebug("browser cookies after session exchange", { 
    cookies,
    sameSite: 'lax' // ← Note if missing PKCE cookies
  });
}, []);
```
**Potential Fix (if needed):** Change to `SameSite=None; Secure` but requires HTTPS everywhere + explicit `sameSite: "none"` in Supabase SSR config

#### 1C. Vercel Edge Runtime Doesn't Persist Cookies on Some Calls
**Failure:** Middleware `getUser()` refreshes session but cookies don't stick
**Current State:** Already removed `request.cookies.set()` in middleware (good!)
- Only uses `response.cookies.set()` ✅
- `/auth/callback` also only uses `response.cookies.set()` ✅
**Risk:** If any new server code calls `cookieStore.set()` outside of Route Handlers

---

### **Priority 2: MEDIUM — Domain/Host Mismatches**

#### 2A. NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN Not Set
**Failure:** After Vercel's apex→www 307, user lands on www but PKCE cookie is apex-only
```
Scenario: User clicks Google → Vercel redirect apex → 307 → www
Cookie Domain=oxecute.com (apex only) → NOT sent to www requests
→ Supabase sees no session on www → "Not authenticated"
```
**Current State:** Env var is **optional** in `.env.example`
**Required for Prod:** Must be set on Vercel:
```
NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.oxecute.com
```
**Verify:** Check Vercel project settings → Environment Variables

#### 2B. Localhost + Cookie Domain Mismatch
**Failure:** If `.env.local` accidentally sets `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.localhost`
```
localhost:3000 → cookie Domain=.localhost → browsers reject (not a valid domain)
```
**Current State:** `.env.example` correctly leaves this **unset** for localhost
**Action:** Developers must NOT set this on localhost

#### 2C. Preview Deploy (*.vercel.app) Cookie Isolation
**Failure:** If preview tries to use `.oxecute.com` domain, cookies won't share
```
pr-123.oxecute.vercel.app → cookie Domain=.oxecute.com → rejected
```
**Current State:** `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN` is only set on production
**Action:** Ensure preview deploys DON'T have this env var set

---

### **Priority 3: MEDIUM — OAuth Redirect Loops & Misconfiguration**

#### 3A. Supabase Site URL Mismatch
**Failure:** Supabase redirects to wrong hostname
```
Site URL = https://oxecute.com (apex)
User signs in on www → Supabase redirects to ?code on apex
Middleware catches it → redirects to /auth/callback on apex (not www)
User expects to be on www → session visible on apex only
```
**Current State:** Site URL is set to `https://www.oxecute.com` ✅ (good!)
**Verify:** Supabase Dashboard → Auth → Redirect URLs includes both apex AND www variants

#### 3B. Missing Redirect URLs in Supabase
**Failure:** New preview deploy or localhost → OAuth fails with "redirect_uri mismatch"
**Current State:** `.env.example` mentions wildcard setup
**Required Redirect URLs:**
- `http://localhost:3000/auth/callback` (dev)
- `https://*.vercel.app/auth/callback` (previews)
- `https://oxecute.com/auth/callback` (apex)
- `https://www.oxecute.com/auth/callback` (www)

#### 3C. Google OAuth Console Mismatch
**Failure:** User sees "redirect URI mismatch" or "invalid origin"
**Current State:** Correctly points to Supabase endpoint only
```
Redirect URI: https://<project>.supabase.co/auth/v1/callback ✅
```
**Verify:** Google Console includes all JS origins (localhost, *.vercel.app, oxecute.com, www.oxecute.com)

---

### **Priority 4: MEDIUM — Session Expiry & Refresh Token Issues**

#### 4A. Access Token Expiration (15 min default)
**Failure:** User's session token expires mid-request
```
User fills out form for 20 minutes → access token expires → next API call 401
Supabase refreshes token automatically (if refresh token valid) but may fail if:
- Refresh token expired (1 week default)
- Cookies weren't persisted correctly
```
**Current State:** No explicit refresh token refresh in `AuthenticatedShell` or API calls
**Mitigation:** If needed, add auto-refresh on 401:
```typescript
// In AuthenticatedShell or create-client
supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') {
    authDebug('token refreshed');
  }
});
```

#### 4B. Middleware Repeated getUser() Calls
**Failure:** Every request calls `supabase.auth.getUser()` (expensive, may rate-limit)
**Current State:** Middleware calls `getUser()` on **every** request
```typescript
// middleware.ts line 68
await supabase.auth.getUser();
```
**Risk:** 
- Supabase might rate-limit on high traffic
- Unnecessary on static routes (_next/static, images, etc.)
**Mitigation:** Already handled by matcher → excludes static assets ✅

#### 4C. No Logout / Session Cleanup
**Failure:** User logs out but cookies linger
**Current State:** No logout endpoint visible in codebase
**Action:** Ensure logout endpoint calls `supabase.auth.signOut({ scope: "local" })` to clear cookies

---

### **Priority 5: EDGE CASES — Browser/Platform Specific**

#### 5A. Brave Browser Shield Rules
**Failure:** Brave blocks third-party cookies or tracking pixels → PKCE cookie fails
```
Brave default: Block third-party cookies, Block fingerprinting
→ Cookie Domain=.oxecute.com might be treated as cross-site
→ Cookie not sent to /auth/callback fetch
```
**Symptom:** Works in Chrome/Firefox, fails silently in Brave
**Current State:** `SameSite=Lax` should help but may not be enough
**Diagnosis:**
- Open Brave DevTools → Application → Cookies
- Look for `sb-*` cookies after OAuth redirect
- If missing → Brave blocked them
**Workaround:** User must allow cookies for oxecute.com in Brave

#### 5B. Safari Intelligent Tracking Prevention (ITP 2.0+)
**Failure:** Safari restricts cookie lifetime to 7 days for cross-domain tracking
```
PKCE cookie Domain=.oxecute.com set during apex→www redirect
→ Safari caps lifetime to 7 days (default is 1 week anyway)
→ Old sessions purged after 7 days
```
**Current State:** Acceptable (refresh token is 1 week, matches Safari limit)
**Action:** None required — already aligned

#### 5C. Firefox Enhanced Tracking Protection + Redirect Loop
**Failure:** Firefox blocks storage.setItem() in content scripts
```
Scenario: PKCE flow tries to store verifier in localStorage
Firefox ETP blocks it → "code verifier not found"
```
**Current State:** Supabase SSR uses cookies, not localStorage ✅
**Action:** None required

#### 5D. Mobile Safari Private Mode (no cookies)
**Failure:** Private mode doesn't persist cookies between app close/reopen
```
User signs in on Safari private → cookies deleted on app close
→ Next session is unauthenticated
```
**Current State:** This is a platform limitation, not a bug
**Action:** Document in onboarding: "Use normal mode for persistent login"

#### 5E. Cloudflare / WAF Stripping Set-Cookie Headers
**Failure:** If Vercel domain is behind a WAF, Set-Cookie headers get filtered
```
/auth/callback returns Set-Cookie → Cloudflare WAF blocks it
→ Cookies never reach browser
```
**Current State:** Vercel manages DNS, not behind Cloudflare
**Action:** If custom DNS added, whitelist Set-Cookie headers in WAF

---

### **Priority 6: CONFIGURATION — Runtime Issues**

#### 6A. Missing Environment Variables on Vercel
**Failure:** Deploy succeeds but auth fails (env vars not set)
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY not set
→ Code fails silently (createServerClient gets empty strings)
```
**Verify Checklist:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set on Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set on Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.oxecute.com` set on Vercel (production only)
- [ ] `NEXT_PUBLIC_SITE_URL` set or omitted (only used for emails, not OAuth)

#### 6B. Auth Debug Flags Left Enabled
**Failure:** Production leaks auth flow details to console
```
NEXT_PUBLIC_AUTH_DEBUG=1 on Vercel → every request logged
→ Performance degradation, potential PII leakage
```
**Current State:** `.env.example` has these commented out ✅
**Action:** Ensure NOT set on production

#### 6C. SUPABASE_SERVICE_ROLE_KEY Exposed
**Failure:** Service role key leaked in client code
```javascript
// ❌ WRONG: exposing service role key
const supabase = createClient(KEY, SERVICE_ROLE_KEY);
```
**Current State:** Code correctly uses ANON_KEY on client ✅
**Verify:** Grep for SERVICE_ROLE_KEY in `src/` — should only be in server code

---

## 🔍 DIAGNOSTIC COMMANDS

### Check Browser Cookies After OAuth
```javascript
// Run in DevTools after signing in
document.cookie
// Should see: sb-auth-token, sb-refresh-token, or similar with Domain=.oxecute.com
```

### Check Middleware is Running
```typescript
// Add to middleware.ts temporarily
authDebug("middleware running", { pathname: request.nextUrl.pathname });
```

### Verify Supabase Session State
```typescript
// In AuthenticatedShell or any client component
const { data: { session } } = await supabase.auth.getSession();
console.log("Session:", session); // Should not be null after login
```

### Test OAuth Flow End-to-End
1. Incognito window
2. Visit `https://www.oxecute.com/login`
3. Click "Sign in with Google"
4. Allow authorization
5. Check DevTools Network tab for redirects:
   - `supabase.co/auth/v1/authorize` (OAuth provider)
   - `google.com/...` (Google sign-in)
   - `supabase.co/auth/v1/callback` (Supabase exchange)
   - `/?code=...` (redirected to root) or `/auth/callback?code=...`
   - `/auth/callback?next=...` (your callback)
   - `/dashboard` or `/start` (final redirect)
6. Verify cookies present with `document.cookie`

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] **Supabase Site URL:** `https://www.oxecute.com`
- [ ] **Supabase Redirect URLs:** All variants (localhost, vercel.app, apex, www)
- [ ] **Vercel Env — PRODUCTION:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN=.oxecute.com`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`
- [ ] **Vercel Env — PREVIEW:**
  - Same as production (no `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN`)
- [ ] **Google OAuth Console:**
  - JS Origins: localhost, *.vercel.app, oxecute.com, www.oxecute.com
  - Redirect URI: `https://<project>.supabase.co/auth/v1/callback`
- [ ] **Auth Debug Flags:** Disabled on production (`AUTH_DEBUG`, `NEXT_PUBLIC_AUTH_DEBUG`)
- [ ] **Service Role Key:** Never exposed to client (`src/`) code
- [ ] **Custom Domain DNS:** Apex (oxecute.com) points to Vercel (Vercel handles 307 to www)
- [ ] **SSL Certificate:** Vercel auto-provisions (no manual action)

---

## 🎯 NEXT STEPS

1. **Immediate:** Verify all Vercel env vars are set (esp. `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN`)
2. **Test:** Run full OAuth flow in incognito + DevTools (check cookies + network)
3. **Monitor:** Enable `NEXT_PUBLIC_AUTH_DEBUG=1` on a preview deploy, test, then disable
4. **Document:** Add "Troubleshooting Auth" section to README with diagnostic commands
5. **Optional:** Add Sentry/Datadog integration to catch 401s and auth failures in production
