# Revolut People MCP

A remote **Model Context Protocol (MCP)** server that connects Claude to the [Revolut People](https://revolutpeople.com) HR platform. Built with Next.js 15, deployed on Vercel, persisted on Supabase.

**MCP Connector URL:** `https://revolutpeople-custom-mcp.vercel.app/mcp`

---

## Features

- **35 tools** covering the entire Revolut People API
- **Multi-user**: each user connects their own service account independently
- **OAuth 2.1 + PKCE** for secure Claude.ai integration
- **Silent re-auth**: after the first login, token renewal is fully transparent (no re-entry for 30 days)
- **5-day token lifecycle**: Revolut People tokens are auto-refreshed via the connect flow

---

## Quick Start

### 1. Add to Claude

In Claude.ai → Settings → Connectors → Add:

```
https://revolutpeople-custom-mcp.vercel.app/mcp
```

### 2. Authenticate

Claude will redirect you to the **Connect** page. Enter:

| Field | Description |
|---|---|
| **Workspace URL** | Your Revolut People URL — found in the browser when logged in, e.g. `https://revolutpeople.com/acme/` |
| **Service Account Email** | The email you used when creating the service account in Access Management |
| **Secret Key** | The secret key generated during service account creation (shown **once only** — save it!) |

### 3. How to create a Service Account

1. Log in to Revolut People
2. Click your avatar (top right) → **Access Management**
3. Click **Add service account** → fill in the form
4. Choose **Secret Key** as authentication method
5. Copy the **email** and **secret key** immediately (the key is shown only once)

---

## Authentication Details

### How it works

```
Claude → OAuth 2.1 PKCE → /api/oauth/authorize
                         → /connect  (first-time: user enters credentials)
                         → POST /api/connect
                             ├── Calls POST {workspaceUrl}api/login/
                             │       body: { email, token: <secret_key> }
                             │       returns: { authenticated, token, expiry_date_time, permissions }
                             ├── Stores token in Supabase (5-day TTL)
                             ├── Sets mcp_user_id cookie (1 year)
                             └── Issues OAuth auth code → Claude gets Bearer token (30 days)

Claude tool call → /mcp → withMcpAuth → RevolutPeopleClient → Revolut People API
                                              └── APITOKEN: <token> header
```

### Revolut People API Authentication

| Property | Value |
|---|---|
| **Login endpoint** | `POST {workspaceUrl}api/login/` |
| **Request body** | `{ "email": "...", "token": "<secret_key>" }` |
| **Response** | `{ "authenticated": true, "token": "...", "expiry_date_time": "...", "permissions": [...] }` |
| **Token validity** | **5 days** |
| **API auth header** | `APITOKEN: <token>` (NOT `Authorization: Bearer`) |
| **Rate limit** | 60 requests/minute → `429 Too Many Requests` |

### Workspace URL

The workspace URL is visible in the browser address bar when logged into Revolut People:

```
https://revolutpeople.com/{workspace_id}/
```

All API calls go to: `{workspaceUrl}api/{endpoint}/`

Example: `https://revolutpeople.com/acme/api/employees/`

### Token Refresh

Revolut People tokens are valid for **5 days**. When a token expires:
- The tool returns an error: *"token has expired, please reconnect"*
- Re-open the connector in Claude → you'll be redirected to `/connect`
- Enter credentials again — the `mcp_user_id` cookie ensures future renewals are **silent** (no re-entry for 30 days)

### Silent Re-auth

After the first login, a `mcp_user_id` cookie (1-year TTL) is set. On subsequent connections:
- Claude hits `/api/oauth/authorize`
- The cookie is detected → credentials verified in Supabase
- Auth code issued immediately — **no form shown to the user**

---

## Available Tools (35)

### Employees (9)

| Tool | Description |
|---|---|
| `list_employees` | List all employees with filters (status, team, department, email, seniority…) |
| `get_employee` | Get a single employee by ID |
| `create_employee` | Create a new employee (login disabled by default) |
| `update_employee` | Fully update an existing employee (PUT) |
| `list_employee_changelog` | Get employee info changelog (field-level history) |
| `list_employee_compensation` | List work and compensation records for an employee |
| `get_employee_compensation` | Get a specific compensation record |
| `update_employee_compensation` | Fully update a compensation record (PUT) |
| `partial_update_employee_compensation` | Partially update a compensation record (PATCH) |

### Departments (2)

| Tool | Description |
|---|---|
| `list_departments` | List all departments with filters |
| `create_department` | Create a new department |

### Teams (3)

| Tool | Description |
|---|---|
| `list_teams` | List all teams |
| `create_team` | Create a new team |
| `update_team` | Update an existing team |

### Roles (2)

| Tool | Description |
|---|---|
| `list_roles` | Get a paginated list of all roles |
| `create_role` | Create a new role |

### Specialisations & Seniorities (4)

| Tool | Description |
|---|---|
| `list_specialisations` | List all specialisations |
| `create_specialisation` | Create a new specialisation |
| `update_specialisation` | Update a specialisation |
| `list_seniorities` | List all seniority levels |

### Recruitment (9)

| Tool | Description |
|---|---|
| `list_candidates` | List all candidates |
| `create_candidate` | Create a new candidate |
| `list_application_forms` | List all application forms |
| `list_interview_feedbacks` | List all interview feedbacks |
| `list_interview_schedulings` | List all interview schedulings |
| `list_job_postings` | List all job postings |
| `list_offer_forms` | List all offer forms |
| `list_requisitions` | List all job requisitions |
| `list_requisition_changelog` | List field-level changes for requisitions |

### Performance (5)

| Tool | Description |
|---|---|
| `list_grades` | List all performance grades |
| `list_performance_scorecards` | List performance scorecards |
| `list_probation_cycles` | List probation cycles |
| `list_probation_decisions` | List probation decisions |
| `list_performance_timeline` | List performance timeline items |

### Time Off (1)

| Tool | Description |
|---|---|
| `list_time_off_requests` | List time off requests (filter by employee, team, status, dates…) |

---

## Architecture

```
src/
├── app/
│   ├── [transport]/route.ts          # MCP endpoint (SSE + HTTP), auth gate
│   ├── connect/
│   │   ├── page.tsx                  # Credential entry page
│   │   └── ConnectForm.tsx           # Credential form (client component)
│   ├── api/
│   │   ├── connect/route.ts          # Form handler — validates & stores credentials
│   │   ├── oauth/
│   │   │   ├── authorize/route.ts    # OAuth 2.1 authorize + silent re-auth
│   │   │   ├── token/route.ts        # Auth code → Bearer token exchange
│   │   │   └── register/route.ts    # Dynamic client registration (RFC 7591)
│   │   └── well-known/
│   │       ├── oauth-authorization-server/route.ts
│   │       └── oauth-protected-resource/route.ts
│   ├── layout.tsx
│   └── page.tsx                      # Homepage with tool list
└── lib/
    ├── auth.ts                        # PKCE, token hashing, bearer helpers
    ├── revolut-people.ts              # Revolut People API client
    ├── store.ts                       # Supabase persistence layer
    └── tools.ts                       # All 35 MCP tool definitions
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Public deployment URL: `https://revolutpeople-custom-mcp.vercel.app` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |

---

## Supabase Schema

```sql
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS mcp_credentials (
  user_id    TEXT PRIMARY KEY,
  data       JSONB NOT NULL,        -- { workspaceUrl, email, revolutToken, tokenExpiresAt, connectedAt }
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mcp_oauth_sessions (
  session_id TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL   -- 10 min TTL
);

CREATE TABLE IF NOT EXISTS mcp_auth_codes (
  code       TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL   -- 5 min TTL
);

CREATE TABLE IF NOT EXISTS mcp_access_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL   -- 30 day TTL
);

CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  client_id TEXT PRIMARY KEY,
  data      JSONB NOT NULL
);

GRANT ALL ON mcp_credentials    TO anon;
GRANT ALL ON mcp_oauth_sessions TO anon;
GRANT ALL ON mcp_auth_codes     TO anon;
GRANT ALL ON mcp_access_tokens  TO anon;
GRANT ALL ON mcp_oauth_clients  TO anon;
```

---

## Known Gotchas

1. **No middleware.ts** — Do NOT create one. It conflicts with the MCP handler.
2. **Connector URL** — Must end with `/mcp`, not `/sse` or `/`.
3. **Workspace URL trailing slash** — The code normalises it automatically.
4. **5-day token expiry** — When expired, users reconnect via `/connect`. The cookie makes re-auth seamless.
5. **`serverExternalPackages`** — `next.config.ts` must include `@vercel/mcp-adapter`.

---

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [@vercel/mcp-adapter](https://github.com/vercel/mcp-adapter)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [Supabase](https://supabase.com) (Postgres persistence)
- [Zod](https://zod.dev) (schema validation)
- [Vercel](https://vercel.com) (deployment)
