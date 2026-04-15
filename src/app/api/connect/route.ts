/**
 * POST /api/connect
 *
 * Receives the Revolut People workspace URL, email, and secret key
 * submitted via the /connect form.
 *
 * Validates the credentials against the Revolut People API (login endpoint),
 * stores the resulting token, generates an auth code, then redirects back to
 * the MCP client.
 *
 * Also sets a long-lived `mcp_user_id` cookie so that subsequent token
 * renewals can be handled silently (no form re-entry needed).
 */
import { NextRequest, NextResponse } from "next/server";
import { generateId, getBaseUrl } from "@/lib/auth";
import { store } from "@/lib/store";
import {
  loginWithSecretKey,
  normaliseWorkspaceUrl,
} from "@/lib/revolut-people";
import { createHash } from "crypto";

const USER_COOKIE = "mcp_user_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const sessionId = form.get("session_id") as string | null;
  const rawWorkspaceUrl = (form.get("workspace_url") as string | null)?.trim();
  const email = (form.get("email") as string | null)?.trim();
  const secretKey = (form.get("secret_key") as string | null)?.trim();

  if (!sessionId || !rawWorkspaceUrl || !email || !secretKey) {
    return redirectWithError(
      getBaseUrl(),
      sessionId,
      "All fields are required."
    );
  }

  // Retrieve the OAuth session
  const session = await store.getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      {
        error:
          "Session expired. Please restart the connection from your MCP client.",
      },
      { status: 400 }
    );
  }

  // normaliseWorkspaceUrl now returns just the slug (e.g. "istituto-formativo-aladia")
  const workspaceSlug = normaliseWorkspaceUrl(rawWorkspaceUrl);

  // Validate credentials against Revolut People
  let revolutToken: string;
  let expiryDateTime: string;
  try {
    const loginResp = await loginWithSecretKey(workspaceSlug, email, secretKey);
    if (!loginResp.authenticated || !loginResp.token) {
      throw new Error("Authentication failed — check your credentials.");
    }
    revolutToken = loginResp.token;
    expiryDateTime = loginResp.expiry_date_time;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return redirectWithError(
      getBaseUrl(),
      sessionId,
      `Connection failed: ${msg}`
    );
  }

  // Derive a stable userId from workspace + email
  const userId = createHash("sha256")
    .update(`${workspaceSlug}:${email}`)
    .digest("hex")
    .slice(0, 32);

  // Persist credentials
  const tokenExpiresAt = expiryDateTime
    ? new Date(expiryDateTime).getTime()
    : Date.now() + 5 * 24 * 60 * 60 * 1000; // fallback: 5 days

  await store.setCredentials(userId, {
    workspaceUrl: workspaceSlug,
    email,
    revolutToken,
    tokenExpiresAt,
    connectedAt: Date.now(),
  });

  // Generate one-time auth code
  const code = generateId(32);
  await store.setCode(code, {
    userId,
    clientId: session.clientId,
    redirectUri: session.redirectUri,
    codeChallenge: session.codeChallenge,
    codeChallengeMethod: session.codeChallengeMethod,
    scope: session.scope,
    createdAt: Date.now(),
  });

  await store.delSession(sessionId);

  // Build redirect back to MCP client
  const redirect = new URL(session.redirectUri);
  redirect.searchParams.set("code", code);
  if (session.state) redirect.searchParams.set("state", session.state);

  // Set long-lived cookie so future token renewals are silent
  const response = NextResponse.redirect(redirect.toString());
  response.cookies.set(USER_COOKIE, userId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

function redirectWithError(
  base: string,
  sessionId: string | null,
  message: string
) {
  const url = new URL(`${base}/connect`);
  if (sessionId) url.searchParams.set("session_id", sessionId);
  url.searchParams.set("error", message);
  // Use 303 See Other so browsers convert POST→GET on redirect
  return NextResponse.redirect(url.toString(), 303);
}
