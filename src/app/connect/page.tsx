/**
 * /connect — Revolut People credential entry page.
 *
 * Reached after the MCP client initiates the OAuth 2.1 flow.
 * The user enters their Revolut People workspace URL, service account
 * email, and secret key here.
 *
 * How to find credentials:
 *   1. Log in to Revolut People → note your workspace URL (e.g. https://revolutpeople.com/acme/)
 *   2. Go to Access Management → Add service account → choose Secret Key method
 *   3. Copy the email and the generated secret key (shown once only)
 */
import { Suspense } from "react";
import ConnectForm from "./ConnectForm";

export default function ConnectPage() {
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt="Revolut People"
            width={48}
            height={48}
            style={{ borderRadius: 10 }}
          />
        </div>

        <h1 style={styles.title}>Connect Revolut People</h1>
        <p style={styles.subtitle}>
          Enter your Revolut People service account credentials. Each team
          member connects their own account independently — tokens are stored
          securely and auto-refreshed.
        </p>

        <Suspense fallback={null}>
          <ConnectForm />
        </Suspense>

        <div style={styles.hint}>
          <p style={{ margin: "0 0 0.4rem", fontWeight: 600, color: "#555" }}>
            Where to find these?
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.6 }}>
            <li>
              Log in to Revolut People — your workspace URL is in the browser
              address bar (e.g.{" "}
              <em>https://revolutpeople.com/acme/</em>)
            </li>
            <li>
              Click your avatar → <strong>Access Management</strong> →{" "}
              <strong>Add service account</strong>
            </li>
            <li>
              Choose <strong>Secret Key</strong> as authentication method
            </li>
            <li>
              Copy the service account <strong>email</strong> and{" "}
              <strong>secret key</strong> (displayed once only — save it!)
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f0f5",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "2.5rem",
    maxWidth: "460px",
    width: "100%",
    boxShadow: "0 4px 28px rgba(0,0,0,0.10)",
  },
  logoWrap: {
    marginBottom: "1.25rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 0.5rem",
    color: "#111",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#555",
    marginBottom: "1.75rem",
    lineHeight: 1.55,
  },
  hint: {
    marginTop: "1.75rem",
    fontSize: "0.8rem",
    color: "#777",
    lineHeight: 1.5,
    background: "#f8f8fc",
    borderRadius: 8,
    padding: "1rem 1.1rem",
    border: "1px solid #e5e5f0",
  },
};
