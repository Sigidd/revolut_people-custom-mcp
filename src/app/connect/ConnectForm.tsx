"use client";
import { useSearchParams } from "next/navigation";

const ACCENT = "#6366f1";

export default function ConnectForm() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const errorMsg = params.get("error");

  return (
    <form method="POST" action="/api/connect" style={styles.form}>
      <input type="hidden" name="session_id" value={sessionId} />

      {errorMsg && <p style={styles.error}>{errorMsg}</p>}

      <label style={styles.label}>
        Workspace Name
        <input
          style={styles.input}
          type="text"
          name="workspace_url"
          placeholder="istituto-formativo-aladia"
          required
          autoComplete="off"
          autoFocus
        />
        <span style={styles.fieldHint}>
          The slug in your Revolut People URL: revolutpeople.com/<strong>your-slug</strong>/ — enter only the slug (e.g. <code>istituto-formativo-aladia</code>)
        </span>
      </label>

      <label style={styles.label}>
        Service Account Email
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="service-account@yourcompany.com"
          required
          autoComplete="off"
        />
      </label>

      <label style={styles.label}>
        Secret Key
        <input
          style={styles.input}
          type="password"
          name="secret_key"
          placeholder="••••••••••••••••••••••••"
          required
          autoComplete="off"
        />
        <span style={styles.fieldHint}>
          Generated when creating the service account (shown once only)
        </span>
      </label>

      <button type="submit" style={styles.button}>
        Connect my account →
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "0.65rem 0.9rem",
    fontSize: "0.85rem",
    margin: 0,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#333",
  },
  input: {
    padding: "0.65rem 0.8rem",
    border: "1.5px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "0.95rem",
    outline: "none",
    fontFamily: "inherit",
  },
  fieldHint: {
    fontWeight: 400,
    fontSize: "0.78rem",
    color: "#888",
  },
  button: {
    marginTop: "0.4rem",
    padding: "0.8rem",
    background: ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
