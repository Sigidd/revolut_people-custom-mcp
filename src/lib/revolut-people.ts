/**
 * Revolut People REST API client.
 *
 * Authentication:
 *   Every request sends:  APITOKEN: <token>
 *   Tokens last 5 days. The client auto-refreshes using the stored
 *   email + secret_key before expiry.
 *
 * Base URL pattern:
 *   https://revolutpeople.com/api/<workspace_slug>/external/services/v1/<endpoint>
 *   e.g. https://revolutpeople.com/api/acme/external/services/v1/employees/
 *
 * Rate limit: 60 req/min → 429 Too Many Requests
 */
import { store, UserCredentials } from "./store";

// ─── Token refresh ─────────────────────────────────────────────────────────────

/**
 * Exchange email + secret_key for a Revolut People API token.
 * Returns { token, expiry_date_time, email, permissions }.
 *
 * Login URL: POST https://revolutpeople.com/api/<workspace_slug>/external/services/v1/login
 */
export async function loginWithSecretKey(
  workspaceSlug: string,
  email: string,
  secretKey: string
): Promise<{ authenticated: boolean; token: string; expiry_date_time: string; email: string; permissions: string[] }> {
  const loginUrl = buildApiUrl(workspaceSlug, "login");
  console.log("[Revolut People] Login URL:", loginUrl);
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ email, token: secretKey }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Revolut People login failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── URL helpers ───────────────────────────────────────────────────────────────

/** Revolut People API base URL pattern */
const REVOLUT_PEOPLE_API_BASE = "https://revolutpeople.com/api/";

/**
 * Extract workspace slug from a full URL or plain slug.
 * Accepts: "istituto-formativo-aladia", "https://revolutpeople.com/istituto-formativo-aladia/", etc.
 */
export function normaliseWorkspaceUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/*$/, "");
  // If it's a full URL, extract the slug
  const match = trimmed.match(/revolutpeople\.com\/([^/?#]+)/);
  if (match) return match[1];
  // Otherwise treat the whole thing as a slug
  return trimmed;
}

/** Build an API URL using the workspace slug */
function buildApiUrl(workspaceSlug: string, path: string): string {
  return `${REVOLUT_PEOPLE_API_BASE}${workspaceSlug}/external/services/v1/${path}`;
}

// ─── Client ────────────────────────────────────────────────────────────────────

export class RevolutPeopleClient {
  constructor(private readonly userId: string) {}

  // ── Token management ─────────────────────────────────────────────────────────

  private async getToken(): Promise<{ token: string; workspaceSlug: string }> {
    const creds = await store.getCredentials(this.userId);
    if (!creds) throw new Error("No credentials found. Please reconnect.");

    // Refresh if token expires within 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    if (creds.tokenExpiresAt - ONE_HOUR < Date.now()) {
      throw new Error(
        "Revolut People token has expired. Please reconnect via the /connect flow."
      );
    }

    return { token: creds.revolutToken, workspaceSlug: creds.workspaceUrl };
  }

  // ── Core request method ──────────────────────────────────────────────────────

  private async request<T = unknown>(
    method: string,
    path: string,
    params?: Record<string, string | number | undefined>,
    body?: unknown
  ): Promise<T> {
    const { token, workspaceSlug } = await this.getToken();

    let url = buildApiUrl(workspaceSlug, path);

    // Append query params
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
          qs.set(k, String(v));
        }
      }
      const qstr = qs.toString();
      if (qstr) url += `?${qstr}`;
    }

    const res = await fetch(url, {
      method,
      headers: {
        APITOKEN: token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      throw new Error(`Revolut People API ${method} ${path} → ${res.status}: ${text}`);
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    return res.json() as Promise<T>;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYEES
  // ═══════════════════════════════════════════════════════════════════════════

  async listEmployees(params?: {
    email?: string;
    status?: string;
    team_id?: number;
    department_id?: number;
    location_id?: number;
    entity_id?: number;
    seniority_id?: number;
    specialisation_id?: number;
    page?: number;
    page_size?: number;
    ordering?: string;
    creation_date_time?: string;
    updated_date_time?: string;
  }) {
    return this.request("GET", "employees", params as Record<string, string | number | undefined>);
  }

  async getEmployee(id: number) {
    return this.request("GET", `employees/${id}`);
  }

  async createEmployee(data: {
    first_name: string;
    last_name: string;
    email: string;
    team: { id: number };
    specialisation: { id: number };
    seniority: { id: number };
    middle_name?: string;
    location?: { id: number };
    entity?: { id: number };
    joining_date_time?: string;
    status?: { id: string };
    termination_date_time?: string;
  }) {
    return this.request("POST", "employees", undefined, data);
  }

  async updateEmployee(
    id: number,
    data: {
      first_name: string;
      last_name: string;
      email: string;
      team: { id: number };
      specialisation: { id: number };
      seniority: { id: number };
      middle_name?: string;
      location?: { id: number };
      entity?: { id: number };
      joining_date_time?: string;
      status?: { id: string };
      termination_date_time?: string;
    }
  ) {
    return this.request("PUT", `employees/${id}`, undefined, data);
  }

  async listEmployeeChangelog(params?: {
    target_id?: number;
    field_name?: string;
    effective_date_time?: string;
    updated_date_time?: string;
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "employees/changelog", params as Record<string, string | number | undefined>);
  }

  async listEmployeeCompensation(employeeId: number, params?: {
    page?: number;
    page_size?: number;
  }) {
    // Flat endpoint — filter by employee_id query param
    return this.request("GET", "employees/work-and-compensation", {
      ...(params ?? {}),
      employee_id: employeeId,
    } as Record<string, string | number | undefined>);
  }

  async getEmployeeCompensation(employeeId: number, compensationId: number) {
    return this.request("GET", `employees/work-and-compensation/${compensationId}`, {
      employee_id: employeeId,
    } as Record<string, string | number | undefined>);
  }

  async updateEmployeeCompensation(
    employeeId: number,
    compensationId: number,
    data: Record<string, unknown>
  ) {
    return this.request("PUT", `employees/work-and-compensation/${compensationId}`, undefined, data);
  }

  async partialUpdateEmployeeCompensation(
    employeeId: number,
    compensationId: number,
    data: Record<string, unknown>
  ) {
    return this.request("PATCH", `employees/work-and-compensation/${compensationId}`, undefined, data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPARTMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async listDepartments(params?: {
    id?: number;
    name?: string;
    owner_id?: number;
    page?: number;
    page_size?: number;
    ordering?: string;
    updated_date_time?: string;
  }) {
    return this.request("GET", "departments", params as Record<string, string | number | undefined>);
  }

  async createDepartment(data: {
    name: string;
    owner?: { id: number };
    mission?: string;
  }) {
    return this.request("POST", "departments", undefined, data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEAMS
  // ═══════════════════════════════════════════════════════════════════════════

  async listTeams(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    updated_date_time?: string;
  }) {
    return this.request("GET", "teams", params as Record<string, string | number | undefined>);
  }

  async createTeam(data: {
    name: string;
    department?: { id: number };
    team_lead?: { id: number };
  }) {
    return this.request("POST", "teams", undefined, data);
  }

  async updateTeam(
    id: number,
    data: {
      name: string;
      department?: { id: number };
      team_lead?: { id: number };
    }
  ) {
    return this.request("PUT", `teams/${id}`, undefined, data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROLES
  // ═══════════════════════════════════════════════════════════════════════════

  async listRoles(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "roles", params as Record<string, string | number | undefined>);
  }

  async createRole(data: {
    name: string;
    department?: { id: number };
  }) {
    return this.request("POST", "roles", undefined, data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCTIONS (alias: roles in some contexts)
  // ═══════════════════════════════════════════════════════════════════════════

  async listFunctions(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "functions", params as Record<string, string | number | undefined>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIALISATIONS & SENIORITIES
  // ═══════════════════════════════════════════════════════════════════════════

  async listSpecialisations(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "specialisations", params as Record<string, string | number | undefined>);
  }

  async createSpecialisation(data: { name: string; role?: { id: number } }) {
    return this.request("POST", "specialisations", undefined, data);
  }

  async updateSpecialisation(
    id: number,
    data: { name: string; role?: { id: number } }
  ) {
    return this.request("PUT", `specialisations/${id}`, undefined, data);
  }

  async listSeniorities(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "seniorities", params as Record<string, string | number | undefined>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECRUITMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async listCandidates(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    updated_date_time?: string;
  }) {
    return this.request("GET", "recruitment/candidates", params as Record<string, string | number | undefined>);
  }

  async createCandidate(data: {
    full_name?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
    country?: { id: number };
    years_of_experience?: number;
  }) {
    return this.request("POST", "recruitment/candidates", undefined, data);
  }

  async listApplicationForms(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    updated_date_time?: string;
    candidate__updated_date_time?: string;
    interview_round__updated_date_time?: string;
  }) {
    return this.request("GET", "recruitment/applications", params as Record<string, string | number | undefined>);
  }

  async listRequisitions(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    updated_date_time?: string;
  }) {
    return this.request("GET", "recruitment/requisitions", params as Record<string, string | number | undefined>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════════════════════════════════════════

  async listGrades(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "employees/grades", params as Record<string, string | number | undefined>);
  }

  async listPerformanceScorecards(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    updated_date_time?: string;
  }) {
    return this.request("GET", "employees/performance-scorecards", params as Record<string, string | number | undefined>);
  }

  async listProbationCycles(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "employees/probation-cycles", params as Record<string, string | number | undefined>);
  }

  async listProbationDecisions(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "employees/probation-decisions", params as Record<string, string | number | undefined>);
  }

  async listPerformanceTimeline(params?: {
    page?: number;
    page_size?: number;
    ordering?: string;
    updated_date_time?: string;
  }) {
    return this.request("GET", "employees/performance-timeline", params as Record<string, string | number | undefined>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME OFF
  // ═══════════════════════════════════════════════════════════════════════════

  async listTimeOffRequests(params?: {
    employee_id?: number;
    team_id?: number;
    department_id?: number;
    approval_status?: string;
    status?: string;
    unit?: string;
    balance_id?: number;
    policy_id?: number;
    start_date_time?: string;
    end_date_time?: string;
    creation_date_time?: string;
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
    return this.request("GET", "employees/time-off-requests", params as Record<string, string | number | undefined>);
  }
}
