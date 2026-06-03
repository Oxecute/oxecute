# Environment Setup Notes

This guide provides a detailed explanation of all environment variables defined in `.env.example` that are required to run Oxecute locally and in production.

---

## Environment Variables Reference

| Variable Name | Required | Frontend Accessible | Purpose | Where to Find / How to Generate |
| :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Yes | The URL of the frontend site, used for computing links. | Local: `http://localhost:3000`<br>Prod: `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Yes | Yes | The canonical app origin used to construct shareable profile links and email URLs. | Local: `http://localhost:3000`<br>Prod: `https://yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | The endpoint URL of your Supabase instance. | Supabase Dashboard → **Project Settings** → **API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Public anonymous key for client-side database queries (respects RLS policies). | Supabase Dashboard → **Project Settings** → **API** → Project API Keys (`anon` public) |
| `NEXT_PUBLIC_SUPABASE_COOKIE_DOMAIN` | No | Yes | Restricts cookies to a specific domain wildcard to prevent PKCE state mismatches. | Leave unset for `localhost`. Set to `.yourdomain.com` for multi-subdomain production environments. |
| `NEXT_PUBLIC_SUPABASE_COOKIE_SAMESITE` | No | Yes | Controls SameSite settings on session cookies. | Leave unset for default. Set to `none` if running cross-origin redirect debugs on Vercel. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **NO** | Superuser key that bypasses Row-Level Security (RLS). Kept secret on the server. | Supabase Dashboard → **Project Settings** → **API** → Project API Keys (`service_role` secret) |
| `ANTHROPIC_API_KEY` | Yes | **NO** | API Key used to call Claude Sonnet for Conexa intelligence generation. | Anthropic Console → **API Keys** |
| `RESEND_API_KEY` | Yes | **NO** | API Key used to send emails through Resend. | Resend Dashboard → **API Keys** |
| `CRON_SECRET` | Yes | **NO** | A secure token passed in the Authorization header to call the cron endpoint. | Generate a long random string (e.g. via `openssl rand -base64 32`). Must match Vercel Cron config. |
| `AUTH_DEBUG` | No | **NO** | Enables detailed server-side authentication state logging. | Set to `1` to enable during development. Leave unset in production. |
| `NEXT_PUBLIC_AUTH_DEBUG` | No | Yes | Enables detailed client-side authentication state logging in browser console. | Set to `1` to enable during development. Leave unset in production. |

---

## Core Setup Instructions

### 1. Supabase Storage Bucket Setup
For manual file uploads, you must configure a storage bucket:
*   Go to **Supabase Dashboard** → **Storage**.
*   Create a new bucket named **`entry-uploads`**.
*   Set it to **Private**.
*   Apply the database migrations in `supabase/migrations/20260513000000_entry_uploads_storage.sql` to apply Row-Level Security (RLS) policies allowing users to read and write only their own files.

### 2. Password Reset SMTP Setup (Production)
To send password reset emails using Resend:
*   Go to **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP**.
*   Enable **Custom SMTP**.
*   Set host to `smtp.resend.com` and port to `587` or `465`.
*   Enter your **`RESEND_API_KEY`** as the SMTP password and `resend` as the username.
*   Configure the "From Email" to use a domain verified on your Resend account.
