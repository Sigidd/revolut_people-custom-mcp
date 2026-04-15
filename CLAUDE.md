# Revolut People MCP — Context for Claude

## What this project is

A **remote MCP server** that connects Claude to the Revolut People HR API. It is a Next.js 15 app deployed on Vercel, using `@vercel/mcp-adapter`.

**MCP endpoint** (use this URL when adding the connector): `https://your-deployment.vercel.app/mcp`

---

## Architecture

```
Claude → OAuth 2.1 → /api/oauth/authorize
                   → /connect  (user enters workspace URL, email, secret key)
                   → POST /api/connect  (validate credentials → store token)
                   → Bearer token issued to Claude

Claude tool call → /mcp → withMcpAuth → RevolutPeopleClient → Revolut People API
```

### Key files

| File | Purpose |
|---|---|
| `src/app/[transport]/route.ts` | MCP endpoint (SSE + HTTP), auth gate |
| `src/lib/tools.ts` | All 35 MCP tool definitions |
| `src/lib/revolut-people.ts` | Revolut People REST API client |
| `src/lib/store.ts` | Supabase persistence layer |
| `src/lib/auth.ts` | Token generation, PKCE, bearer helpers |
| `src/app/connect/page.tsx` | Credential entry page (server component) |
| `src/app/connect/ConnectForm.tsx` | Credential entry form (client component) |
| `src/app/api/connect/route.ts` | Form handler — validates creds, stores token, issues auth code |
| `src/app/api/oauth/authorize/route.ts` | OAuth 2.1 authorization endpoint + silent re-auth |
| `src/app/api/oauth/token/route.ts` | Token exchange endpoint (our code → our bearer token) |
| `src/app/api/oauth/register/route.ts` | Dynamic client registration (RFC 7591) |

---

## OAuth Flow (credential form, not external OAuth)

Revolut People uses API key (secret key) auth — no external OAuth redirect.

1. Claude calls `GET /api/oauth/authorize` with PKCE (S256 required)
2. **Silent re-auth**: if `mcp_user_id` cookie exists and credentials valid in Supabase → skip form, issue code immediately
3. **First-time**: session saved to Supabase, user redirected to `/connect`
4. User fills in: workspace URL, service account email, secret key
5. `POST /api/connect` exchanges secret key for Revolut People token via login endpoint
6. Token stored in Supabase, userId derived from `SHA256(workspaceUrl:email)`, cookie set
7. Auth code issued → Claude exchanges for our Bearer token via `/api/oauth/token`

---

## Revolut People Authentication

- **Login endpoint**: `POST {workspaceUrl}api/login/`
- **Request body**: `{ "email": "...", "token": "<secret_key>" }`
- **Response**: `{ "authenticated": true, "token": "<revolut_people_token>", "expiry_date_time": "..." }`
- **Token validity**: 5 days
- **API header**: `APITOKEN: <token>` (NOT Bearer)
- **Rate limit**: 60 requests/minute → 429 Too Many Requests

### Workspace URL

The workspace URL is found in the browser when logged into Revolut People:
`https://revolutpeople.com/{workspace_id}/`

All API calls are relative to: `{workspaceUrl}api/` (e.g. `https://revolutpeople.com/acme/api/employees/`)

### Token Refresh

Tokens are valid for 5 days. When expired:
- The `RevolutPeopleClient.getToken()` throws an error prompting the user to reconnect
- Users re-enter credentials via the `/connect` flow
- The session cookie means future renewals after reconnecting are silent again

---

## Supabase Schema

```sql
-- Run these in Supabase SQL editor

-- MCP credentials: Revolut People token per userId (JSONB)
CREATE TABLE IF NOT EXISTS mcp_credentials (
  user_id TEXT PRIMARY KEY,
  data    JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth sessions (10 min TTL)
CREATE TABLE IF NOT EXISTS mcp_oauth_sessions (
  session_id TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Auth codes (5 min TTL)
CREATE TABLE IF NOT EXISTS mcp_auth_codes (
  code       TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Bearer token hashes (30 day TTL)
CREATE TABLE IF NOT EXISTS mcp_access_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Registered OAuth clients
CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  client_id TEXT PRIMARY KEY,
  data      JSONB NOT NULL
);

-- Grant anon access (RLS disabled)
GRANT ALL ON mcp_credentials TO anon;
GRANT ALL ON mcp_oauth_sessions TO anon;
GRANT ALL ON mcp_auth_codes TO anon;
GRANT ALL ON mcp_access_tokens TO anon;
GRANT ALL ON mcp_oauth_clients TO anon;
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Public deployment URL, e.g. `https://revolutpeople-custom-mcp.vercel.app` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |

---

## Known Gotchas

1. **No middleware.ts** — Do NOT create a middleware.ts file. It causes routing conflicts with the MCP handler's pathname checks. The connector points directly to `/mcp`.

2. **Connector URL** — Must be `https://your-deployment.vercel.app/mcp` (the `/mcp` path, not `/sse` or root).

3. **`force-dynamic` on well-known routes** — The oauth-authorization-server route uses `dynamic = "force-dynamic"` because `getBaseUrl()` reads env vars at runtime.

4. **`serverExternalPackages`** — `next.config.ts` must include `@vercel/mcp-adapter` in `serverExternalPackages` to avoid bundling issues on Vercel.

5. **Workspace URL trailing slash** — `normaliseWorkspaceUrl()` ensures the URL always ends with `/` before appending `api/`.

6. **5-day token expiry** — Unlike Revolut Business (40min tokens), Revolut People tokens last 5 days. When expired, users must reconnect via the form. The cookie makes this seamless after the first time.

---

## Tools (35 total)

| Category | Tools |
|---|---|
| Employees | `list_employees`, `get_employee`, `create_employee`, `update_employee`, `list_employee_changelog`, `list_employee_compensation`, `get_employee_compensation`, `update_employee_compensation`, `partial_update_employee_compensation` |
| Departments | `list_departments`, `create_department` |
| Teams | `list_teams`, `create_team`, `update_team` |
| Roles | `list_roles`, `create_role` |
| Specialisations | `list_specialisations`, `create_specialisation`, `update_specialisation` |
| Seniorities | `list_seniorities` |
| Recruitment | `list_candidates`, `create_candidate`, `list_application_forms`, `list_interview_feedbacks`, `list_interview_schedulings`, `list_job_postings`, `list_offer_forms`, `list_requisitions`, `list_requisition_changelog` |
| Performance | `list_grades`, `list_performance_scorecards`, `list_probation_cycles`, `list_probation_decisions`, `list_performance_timeline` |
| Time Off | `list_time_off_requests` |
