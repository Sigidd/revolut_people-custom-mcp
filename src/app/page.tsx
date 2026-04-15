/**
 * Homepage — lists available tools and shows connection instructions.
 */

const tools = [
  // Employees
  { name: "list_employees", description: "List all employees with filters (status, team, department, email…)" },
  { name: "get_employee", description: "Get a single employee by ID" },
  { name: "create_employee", description: "Create a new employee (login disabled by default)" },
  { name: "update_employee", description: "Fully update an existing employee" },
  { name: "list_employee_changelog", description: "Get employee info changelog (field-level history)" },
  { name: "list_employee_compensation", description: "List work and compensation records for an employee" },
  { name: "get_employee_compensation", description: "Get a specific compensation record" },
  { name: "update_employee_compensation", description: "Fully update a compensation record" },
  { name: "partial_update_employee_compensation", description: "Partially update a compensation record (PATCH)" },
  // Departments
  { name: "list_departments", description: "List all departments" },
  { name: "create_department", description: "Create a new department" },
  // Teams
  { name: "list_teams", description: "List all teams" },
  { name: "create_team", description: "Create a new team" },
  { name: "update_team", description: "Update an existing team" },
  // Roles
  { name: "list_roles", description: "List all roles" },
  { name: "create_role", description: "Create a new role" },
  // Specialisations & Seniorities
  { name: "list_specialisations", description: "List all specialisations" },
  { name: "create_specialisation", description: "Create a new specialisation" },
  { name: "update_specialisation", description: "Update a specialisation" },
  { name: "list_seniorities", description: "List all seniority levels" },
  // Recruitment
  { name: "list_candidates", description: "List all recruitment candidates" },
  { name: "create_candidate", description: "Create a new candidate" },
  { name: "list_application_forms", description: "List all application forms" },
  { name: "list_interview_feedbacks", description: "List all interview feedbacks" },
  { name: "list_interview_schedulings", description: "List all interview schedulings" },
  { name: "list_job_postings", description: "List all job postings" },
  { name: "list_offer_forms", description: "List all offer forms" },
  { name: "list_requisitions", description: "List all job requisitions" },
  { name: "list_requisition_changelog", description: "List field-level changes for requisitions" },
  // Performance
  { name: "list_grades", description: "List all performance grades" },
  { name: "list_performance_scorecards", description: "List performance scorecards" },
  { name: "list_probation_cycles", description: "List probation cycles" },
  { name: "list_probation_decisions", description: "List probation decisions" },
  { name: "list_performance_timeline", description: "List performance timeline items" },
  // Time Off
  { name: "list_time_off_requests", description: "List time off requests with rich filters" },
];

const ACCENT = "#6366f1"; // indigo — matches Revolut People brand colors

export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 820,
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.png"
          alt="Revolut People MCP"
          width={64}
          height={64}
          style={{ borderRadius: 12 }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Revolut People MCP</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#666" }}>
            Connect Claude to your Revolut People HR platform
          </p>
        </div>
      </div>

      {/* Quick Install */}
      <section
        style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#0369a1" }}>
          Quick Install
        </h2>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
          Add this MCP server to Claude using the URL below:
        </p>
        <code
          style={{
            display: "block",
            background: "#e0f2fe",
            padding: "0.5rem 0.75rem",
            borderRadius: 6,
            fontFamily: "monospace",
            fontSize: "0.9rem",
            wordBreak: "break-all",
          }}
        >
          https://your-deployment.vercel.app/mcp
        </code>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#0369a1" }}>
          The connector URL must end with <strong>/mcp</strong>
        </p>
      </section>

      {/* How it works */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
          How it works
        </h2>
        <ol
          style={{ paddingLeft: "1.25rem", lineHeight: 1.7, color: "#374151" }}
        >
          <li>Add the MCP server URL to Claude</li>
          <li>
            Claude triggers the OAuth 2.1 flow — you are redirected to a
            connection form
          </li>
          <li>
            Enter your Revolut People workspace URL, service account email, and
            secret key
          </li>
          <li>
            Your credentials are validated and stored — Claude can now access
            your Revolut People data
          </li>
          <li>
            Future sessions use silent re-auth (no form re-entry needed for 30
            days)
          </li>
        </ol>
      </section>

      {/* Tools list */}
      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
          Available Tools ({tools.length})
        </h2>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {tools.map((tool) => (
            <div
              key={tool.name}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.6rem 0.75rem",
                background: "#f9fafb",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
              }}
            >
              <code
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  color: ACCENT,
                  flexShrink: 0,
                  minWidth: 260,
                }}
              >
                {tool.name}
              </code>
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                {tool.description}
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          marginTop: "3rem",
          paddingTop: "1rem",
          borderTop: "1px solid #e5e7eb",
          fontSize: "0.8rem",
          color: "#9ca3af",
        }}
      >
        <p>
          Powered by the{" "}
          <a
            href="https://modelcontextprotocol.io"
            style={{ color: ACCENT }}
          >
            Model Context Protocol
          </a>{" "}
          and{" "}
          <a href="https://vercel.com" style={{ color: ACCENT }}>
            Vercel
          </a>
        </p>
      </footer>
    </main>
  );
}
