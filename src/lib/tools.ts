/**
 * Registers all Revolut People MCP tools on the given McpServer instance.
 *
 * Tools (35 total):
 *   Employees:        list_employees, get_employee, create_employee, update_employee,
 *                     list_employee_changelog, list_employee_compensation,
 *                     get_employee_compensation, update_employee_compensation,
 *                     partial_update_employee_compensation
 *   Departments:      list_departments, create_department
 *   Teams:            list_teams, create_team, update_team
 *   Roles:            list_roles, create_role
 *   Specialisations:  list_specialisations, create_specialisation, update_specialisation
 *   Seniorities:      list_seniorities
 *   Recruitment:      list_candidates, create_candidate, list_application_forms,
 *                     list_interview_feedbacks, list_interview_schedulings,
 *                     list_job_postings, list_offer_forms, list_requisitions,
 *                     list_requisition_changelog
 *   Performance:      list_grades, list_performance_scorecards, list_probation_cycles,
 *                     list_probation_decisions, list_performance_timeline
 *   Time Off:         list_time_off_requests
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RevolutPeopleClient } from "./revolut-people";

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function err(e: unknown): ToolResult {
  const msg = e instanceof Error ? e.message : String(e);
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

const optStr = z.string().optional();
const optNum = z.number().optional();
const optInt = z.number().int().optional();

export function registerTools(server: McpServer, client: RevolutPeopleClient) {
  // ════════════════════════════════════════════════════════════════════════════
  // EMPLOYEES
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_employees",
    "List all employees with optional filters (status, team, department, email, etc.)",
    {
      email: optStr.describe("Filter by employee email"),
      status: optStr.describe(
        "Filter by status: active, archived, onboarding, hired, inactive, terminated"
      ),
      team_id: optInt.describe("Filter by team ID"),
      department_id: optInt.describe("Filter by department ID"),
      location_id: optInt.describe("Filter by location ID"),
      entity_id: optInt.describe("Filter by entity ID"),
      seniority_id: optInt.describe("Filter by seniority ID"),
      specialisation_id: optInt.describe("Filter by specialisation ID"),
      page: optInt.describe("Page number (default 1)"),
      page_size: optInt.describe("Results per page (default 25)"),
      ordering: optStr.describe("Field to order results by"),
      creation_date_time: optStr.describe("Filter by creation datetime (ISO 8601)"),
      updated_date_time: optStr.describe("Filter by last updated datetime (ISO 8601)"),
    },
    async (params) => {
      try {
        return ok(await client.listEmployees(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_employee",
    "Get a single employee by their ID",
    { id: z.number().int().describe("Employee ID") },
    async ({ id }) => {
      try {
        return ok(await client.getEmployee(id));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_employee",
    "Create a new employee. Login is disabled by default until an invitation is sent.",
    {
      first_name: z.string().describe("Employee first name (required)"),
      last_name: z.string().describe("Employee last name (required)"),
      email: z.string().email().describe("Employee email (required)"),
      team_id: z.number().int().describe("Team ID (required)"),
      specialisation_id: z.number().int().describe("Specialisation ID (required)"),
      seniority_id: z.number().int().describe("Seniority ID (required)"),
      middle_name: optStr.describe("Middle name (optional)"),
      location_id: optInt.describe("Location ID (optional)"),
      entity_id: optInt.describe("Entity ID (optional)"),
      joining_date_time: optStr.describe("Joining datetime ISO 8601 (optional)"),
      status_id: optStr.describe(
        "Status ID: active, hired, onboarding, etc. (optional)"
      ),
      termination_date_time: optStr.describe(
        "Termination datetime ISO 8601 (optional)"
      ),
    },
    async ({
      first_name,
      last_name,
      email,
      team_id,
      specialisation_id,
      seniority_id,
      middle_name,
      location_id,
      entity_id,
      joining_date_time,
      status_id,
      termination_date_time,
    }) => {
      try {
        return ok(
          await client.createEmployee({
            first_name,
            last_name,
            email,
            team: { id: team_id },
            specialisation: { id: specialisation_id },
            seniority: { id: seniority_id },
            ...(middle_name ? { middle_name } : {}),
            ...(location_id ? { location: { id: location_id } } : {}),
            ...(entity_id ? { entity: { id: entity_id } } : {}),
            ...(joining_date_time ? { joining_date_time } : {}),
            ...(status_id ? { status: { id: status_id } } : {}),
            ...(termination_date_time ? { termination_date_time } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update_employee",
    "Update an existing employee (full update — all required fields must be provided)",
    {
      id: z.number().int().describe("Employee ID"),
      first_name: z.string().describe("Employee first name"),
      last_name: z.string().describe("Employee last name"),
      email: z.string().email().describe("Employee email"),
      team_id: z.number().int().describe("Team ID"),
      specialisation_id: z.number().int().describe("Specialisation ID"),
      seniority_id: z.number().int().describe("Seniority ID"),
      middle_name: optStr.describe("Middle name"),
      location_id: optInt.describe("Location ID"),
      entity_id: optInt.describe("Entity ID"),
      joining_date_time: optStr.describe("Joining datetime ISO 8601"),
      status_id: optStr.describe("Status ID"),
      termination_date_time: optStr.describe("Termination datetime ISO 8601"),
    },
    async ({
      id,
      first_name,
      last_name,
      email,
      team_id,
      specialisation_id,
      seniority_id,
      middle_name,
      location_id,
      entity_id,
      joining_date_time,
      status_id,
      termination_date_time,
    }) => {
      try {
        return ok(
          await client.updateEmployee(id, {
            first_name,
            last_name,
            email,
            team: { id: team_id },
            specialisation: { id: specialisation_id },
            seniority: { id: seniority_id },
            ...(middle_name ? { middle_name } : {}),
            ...(location_id ? { location: { id: location_id } } : {}),
            ...(entity_id ? { entity: { id: entity_id } } : {}),
            ...(joining_date_time ? { joining_date_time } : {}),
            ...(status_id ? { status: { id: status_id } } : {}),
            ...(termination_date_time ? { termination_date_time } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_employee_changelog",
    "Get a list of employee info changelog items (field-level changes history)",
    {
      target_id: optInt.describe("Filter by employee ID"),
      field_name: optStr.describe("Filter by field name"),
      effective_date_time: optStr.describe("Filter by effective datetime (ISO 8601)"),
      updated_date_time: optStr.describe("Filter by updated datetime (ISO 8601)"),
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listEmployeeChangelog(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_employee_compensation",
    "List work and compensation details for a specific employee",
    {
      employee_id: z.number().int().describe("Employee ID"),
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
    },
    async ({ employee_id, page, page_size }) => {
      try {
        return ok(await client.listEmployeeCompensation(employee_id, { page, page_size }));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "get_employee_compensation",
    "Get a specific work and compensation details record for an employee",
    {
      employee_id: z.number().int().describe("Employee ID"),
      compensation_id: z.number().int().describe("Compensation record ID"),
    },
    async ({ employee_id, compensation_id }) => {
      try {
        return ok(await client.getEmployeeCompensation(employee_id, compensation_id));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update_employee_compensation",
    "Fully update a work and compensation details record for an employee",
    {
      employee_id: z.number().int().describe("Employee ID"),
      compensation_id: z.number().int().describe("Compensation record ID"),
      data: z
        .record(z.unknown())
        .describe("Compensation fields to update (as a JSON object)"),
    },
    async ({ employee_id, compensation_id, data }) => {
      try {
        return ok(
          await client.updateEmployeeCompensation(employee_id, compensation_id, data)
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "partial_update_employee_compensation",
    "Partially update a work and compensation details record for an employee (PATCH)",
    {
      employee_id: z.number().int().describe("Employee ID"),
      compensation_id: z.number().int().describe("Compensation record ID"),
      data: z
        .record(z.unknown())
        .describe("Compensation fields to patch (as a JSON object)"),
    },
    async ({ employee_id, compensation_id, data }) => {
      try {
        return ok(
          await client.partialUpdateEmployeeCompensation(
            employee_id,
            compensation_id,
            data
          )
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // DEPARTMENTS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_departments",
    "Get a list of all departments",
    {
      id: optInt.describe("Filter by department ID"),
      name: optStr.describe("Filter by department name"),
      owner_id: optInt.describe("Filter by owner employee ID"),
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listDepartments(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_department",
    "Create a new department",
    {
      name: z.string().describe("Department name (required)"),
      owner_id: optInt.describe("Owner employee ID (optional)"),
      mission: optStr.describe("Department mission statement (optional)"),
    },
    async ({ name, owner_id, mission }) => {
      try {
        return ok(
          await client.createDepartment({
            name,
            ...(owner_id ? { owner: { id: owner_id } } : {}),
            ...(mission ? { mission } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TEAMS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_teams",
    "Get a list of all teams",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listTeams(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_team",
    "Create a new team",
    {
      name: z.string().describe("Team name (required)"),
      department_id: optInt.describe("Department ID (optional)"),
      team_lead_id: optInt.describe("Team lead employee ID (optional)"),
    },
    async ({ name, department_id, team_lead_id }) => {
      try {
        return ok(
          await client.createTeam({
            name,
            ...(department_id ? { department: { id: department_id } } : {}),
            ...(team_lead_id ? { team_lead: { id: team_lead_id } } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update_team",
    "Update an existing team",
    {
      id: z.number().int().describe("Team ID"),
      name: z.string().describe("Team name (required)"),
      department_id: optInt.describe("Department ID (optional)"),
      team_lead_id: optInt.describe("Team lead employee ID (optional)"),
    },
    async ({ id, name, department_id, team_lead_id }) => {
      try {
        return ok(
          await client.updateTeam(id, {
            name,
            ...(department_id ? { department: { id: department_id } } : {}),
            ...(team_lead_id ? { team_lead: { id: team_lead_id } } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // ROLES
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_roles",
    "Get a paginated list of all roles",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listRoles(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_role",
    "Create a new role",
    {
      name: z.string().describe("Role name (required)"),
      department_id: optInt.describe("Department ID (optional)"),
    },
    async ({ name, department_id }) => {
      try {
        return ok(
          await client.createRole({
            name,
            ...(department_id ? { department: { id: department_id } } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SPECIALISATIONS & SENIORITIES
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_specialisations",
    "Get a list of all specialisations",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listSpecialisations(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_specialisation",
    "Create a new specialisation",
    {
      name: z.string().describe("Specialisation name (required)"),
      role_id: optInt.describe("Role ID (optional)"),
    },
    async ({ name, role_id }) => {
      try {
        return ok(
          await client.createSpecialisation({
            name,
            ...(role_id ? { role: { id: role_id } } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "update_specialisation",
    "Update a specialisation",
    {
      id: z.number().int().describe("Specialisation ID"),
      name: z.string().describe("Specialisation name"),
      role_id: optInt.describe("Role ID (optional)"),
    },
    async ({ id, name, role_id }) => {
      try {
        return ok(
          await client.updateSpecialisation(id, {
            name,
            ...(role_id ? { role: { id: role_id } } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_seniorities",
    "Get a list of all seniority levels",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listSeniorities(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RECRUITMENT
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_candidates",
    "Get a list of all recruitment candidates",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime (ISO 8601)"),
    },
    async (params) => {
      try {
        return ok(await client.listCandidates(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "create_candidate",
    "Create a new recruitment candidate",
    {
      full_name: optStr.describe("Candidate full name"),
      email: optStr.describe("Candidate email"),
      phone: optStr.describe("Candidate phone number"),
      linkedin_url: optStr.describe("LinkedIn profile URL"),
      country_id: optInt.describe("Country ID"),
      years_of_experience: optInt.describe("Years of experience"),
    },
    async ({ full_name, email, phone, linkedin_url, country_id, years_of_experience }) => {
      try {
        return ok(
          await client.createCandidate({
            ...(full_name ? { full_name } : {}),
            ...(email ? { email } : {}),
            ...(phone ? { phone } : {}),
            ...(linkedin_url ? { linkedin_url } : {}),
            ...(country_id ? { country: { id: country_id } } : {}),
            ...(years_of_experience !== undefined ? { years_of_experience } : {}),
          })
        );
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_application_forms",
    "Get a list of all recruitment application forms",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
      candidate__updated_date_time: optStr.describe(
        "Filter by candidate updated datetime (comma-separated range)"
      ),
      interview_round__updated_date_time: optStr.describe(
        "Filter by interview round updated datetime"
      ),
    },
    async (params) => {
      try {
        return ok(await client.listApplicationForms(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_interview_feedbacks",
    "Get a list of all interview feedbacks",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listInterviewFeedbacks(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_interview_schedulings",
    "Get a list of all interview schedulings",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listInterviewSchedulings(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_job_postings",
    "Get a list of all job postings",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listJobPostings(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_offer_forms",
    "Get a list of all offer forms",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listOfferForms(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_requisitions",
    "Get a list of all job requisitions",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listRequisitions(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_requisition_changelog",
    "Get a detailed list of field-level changes for requisitions",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listRequisitionChangelog(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PERFORMANCE
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_grades",
    "Get a list of all performance grades",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listGrades(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_performance_scorecards",
    "Get a list of performance scorecards",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listPerformanceScorecards(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_probation_cycles",
    "Get a list of probation cycles",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listProbationCycles(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_probation_decisions",
    "Get a list of probation decisions",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listProbationDecisions(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  server.tool(
    "list_performance_timeline",
    "Get a list of performance timeline items",
    {
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
      updated_date_time: optStr.describe("Filter by last updated datetime"),
    },
    async (params) => {
      try {
        return ok(await client.listPerformanceTimeline(params));
      } catch (e) {
        return err(e);
      }
    }
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TIME OFF REQUESTS
  // ════════════════════════════════════════════════════════════════════════════

  server.tool(
    "list_time_off_requests",
    "Get a list of time off requests with rich filtering options",
    {
      employee_id: optInt.describe("Filter by employee ID"),
      team_id: optInt.describe("Filter by team ID"),
      department_id: optInt.describe("Filter by department ID"),
      approval_status: optStr.describe(
        "Filter by approval status: approved, cancelled, pending, rejected"
      ),
      status: optStr.describe(
        "Filter by status: upcoming, in_progress, completed"
      ),
      unit: optStr.describe("Filter by unit: day or hour"),
      balance_id: optInt.describe("Filter by balance ID"),
      policy_id: optInt.describe("Filter by policy ID"),
      start_date_time: optStr.describe(
        "Filter by start datetime (ISO 8601)"
      ),
      end_date_time: optStr.describe("Filter by end datetime (ISO 8601)"),
      creation_date_time: optStr.describe(
        "Filter by creation datetime (ISO 8601)"
      ),
      page: optInt.describe("Page number"),
      page_size: optInt.describe("Results per page"),
      ordering: optStr.describe("Ordering field"),
    },
    async (params) => {
      try {
        return ok(await client.listTimeOffRequests(params));
      } catch (e) {
        return err(e);
      }
    }
  );
}
