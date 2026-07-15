import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

const mockPort = 54321;
const appPort = 3100;
const learnerId = "00000000-0000-4000-8000-000000000001";

type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  created_at: string;
};

type StoredState = {
  users: Map<string, TestUser>;
  accessTokens: Map<string, string>;
  refreshTokens: Map<string, string>;
  progress: Map<string, Record<string, unknown>>;
  rows: Map<string, Record<string, unknown>[]>;
  rateLimits: Map<string, { count: number; expiresAt: number }>;
  writes: Record<string, number>;
};

const state: StoredState = {
  users: new Map(),
  accessTokens: new Map(),
  refreshTokens: new Map(),
  progress: new Map(),
  rows: new Map(),
  rateLimits: new Map(),
  writes: {},
};

function seedUser() {
  state.users.set("learner@example.com", {
    id: learnerId,
    email: "learner@example.com",
    password: "Test-Passwort-2026",
    name: "Test Learner",
    created_at: "2026-07-13T00:00:00.000Z",
  });
}

function reset() {
  state.users.clear();
  state.accessTokens.clear();
  state.refreshTokens.clear();
  state.progress.clear();
  state.rows.clear();
  state.rateLimits.clear();
  state.writes = {};
  seedUser();
}

function json(response: ServerResponse, status: number, body: unknown, contentType = "application/json") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, prefer, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  });
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function userResponse(user: TestUser) {
  return {
    id: user.id,
    aud: "authenticated",
    role: "authenticated",
    email: user.email,
    email_confirmed_at: user.created_at,
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { name: user.name },
    identities: [],
    created_at: user.created_at,
    updated_at: user.created_at,
    is_anonymous: false,
  };
}

function jwt(user: TestUser, expiresAt: number) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    aud: "authenticated",
    exp: expiresAt,
    iat: Math.floor(Date.now() / 1000),
    iss: `http://127.0.0.1:${mockPort}/auth/v1`,
    role: "authenticated",
    sub: user.id,
    email: user.email,
  })}.test-signature`;
}

function session(user: TestUser) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const accessToken = jwt(user, expiresAt);
  const refreshToken = randomUUID();
  state.accessTokens.set(accessToken, user.id);
  state.refreshTokens.set(refreshToken, user.id);
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: refreshToken,
    user: userResponse(user),
  };
}

function userById(id: string) {
  return [...state.users.values()].find((user) => user.id === id);
}

function bearer(request: IncomingMessage) {
  const value = request.headers.authorization ?? "";
  return value.replace(/^Bearer\s+/i, "");
}

function authenticatedUser(request: IncomingMessage) {
  const userId = state.accessTokens.get(bearer(request));
  return userId ? userById(userId) : undefined;
}

function increment(table: string) {
  state.writes[table] = (state.writes[table] ?? 0) + 1;
}

async function authRoute(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
    const body = await readBody(request);
    const email = String(body.email ?? "").toLowerCase();
    const user = state.users.get(email);
    if (!user || body.password !== user.password) {
      json(response, 400, { code: "invalid_credentials", message: "Invalid login credentials" });
      return;
    }
    json(response, 200, session(user));
    return;
  }

  if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
    const body = await readBody(request);
    const userId = state.refreshTokens.get(String(body.refresh_token ?? ""));
    const user = userId ? userById(userId) : undefined;
    if (!user) {
      json(response, 400, { code: "refresh_token_not_found", message: "Invalid Refresh Token" });
      return;
    }
    json(response, 200, session(user));
    return;
  }

  if (url.pathname === "/auth/v1/signup" && request.method === "POST") {
    const body = await readBody(request);
    const email = String(body.email ?? "").toLowerCase();
    if (state.users.has(email)) {
      json(response, 422, { code: "user_already_exists", message: "User already registered" });
      return;
    }
    const metadata = (body.data ?? {}) as Record<string, unknown>;
    const user: TestUser = {
      id: randomUUID(),
      email,
      password: String(body.password ?? ""),
      name: String(metadata.name ?? ""),
      created_at: new Date().toISOString(),
    };
    state.users.set(email, user);
    json(response, 200, session(user));
    return;
  }

  if (url.pathname === "/auth/v1/user" && request.method === "GET") {
    const user = authenticatedUser(request);
    if (!user) {
      json(response, 401, { code: "bad_jwt", message: "invalid JWT" });
      return;
    }
    json(response, 200, userResponse(user));
    return;
  }

  if (url.pathname === "/auth/v1/logout" && request.method === "POST") {
    const accessToken = bearer(request);
    if (accessToken) state.accessTokens.delete(accessToken);
    json(response, 204, null);
    return;
  }

  json(response, 404, { message: `Unhandled auth route ${request.method} ${url.pathname}` });
}

async function restRoute(request: IncomingMessage, response: ServerResponse, url: URL) {
  if (url.pathname === "/rest/v1/rpc/consume_request_rate_limit" && request.method === "POST") {
    const body = await readBody(request);
    const limit = Number(body.p_limit);
    const windowSeconds = Number(body.p_window_seconds);
    const key = `${String(body.p_scope)}:${String(body.p_key_hash)}`;
    const now = Date.now();
    const current = state.rateLimits.get(key);
    const counter = !current || current.expiresAt <= now
      ? { count: 1, expiresAt: now + windowSeconds * 1000 }
      : { count: current.count + 1, expiresAt: current.expiresAt };
    state.rateLimits.set(key, counter);
    json(response, 200, [{
      allowed: counter.count <= limit,
      remaining: Math.max(limit - counter.count, 0),
      retry_after_seconds: Math.max(Math.ceil((counter.expiresAt - now) / 1000), 1),
    }]);
    return;
  }

  const user = authenticatedUser(request);
  if (!user) {
    json(response, 401, { code: "PGRST301", message: "JWT expired" });
    return;
  }
  const table = url.pathname.split("/").filter(Boolean)[2];
  if (!table) {
    json(response, 404, { message: "Missing table" });
    return;
  }

  if (request.method === "GET" && table === "user_progress") {
    const row = state.progress.get(user.id);
    const wantsObject = String(request.headers.accept ?? "").includes("application/vnd.pgrst.object+json");
    if (!row) {
      if (wantsObject) {
        json(response, 406, {
          code: "PGRST116",
          details: "The result contains 0 rows",
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned",
        });
      } else {
        json(response, 200, []);
      }
      return;
    }
    json(
      response,
      200,
      wantsObject ? row : [row],
      wantsObject ? "application/vnd.pgrst.object+json" : "application/json"
    );
    return;
  }

  if (request.method === "GET" && (table === "lesson_attempts" || table === "vocabulary_review_events")) {
    json(response, 200, state.rows.get(table) ?? []);
    return;
  }

  if (request.method === "POST") {
    const body = await readBody(request);
    increment(table);
    if (table === "user_progress") {
      state.progress.set(user.id, { ...(state.progress.get(user.id) ?? {}), ...body, user_id: user.id });
    } else {
      const rows = state.rows.get(table) ?? [];
      const eventId = String(body.client_event_id ?? "");
      const existingIndex = eventId
        ? rows.findIndex((row) => row.user_id === user.id && row.client_event_id === eventId)
        : -1;
      const row = { ...body, user_id: user.id };
      if (existingIndex >= 0) rows[existingIndex] = row;
      else rows.push(row);
      state.rows.set(table, rows);
    }
    json(response, 201, []);
    return;
  }

  json(response, 404, { message: `Unhandled REST route ${request.method} ${url.pathname}` });
}

reset();

const mockServer = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${mockPort}`);
    if (request.method === "OPTIONS") {
      json(response, 200, {});
      return;
    }
    if (url.pathname === "/__test/reset" && request.method === "POST") {
      reset();
      json(response, 200, { ok: true });
      return;
    }
    if (url.pathname === "/__test/expire" && request.method === "POST") {
      state.accessTokens.clear();
      state.refreshTokens.clear();
      json(response, 200, { ok: true });
      return;
    }
    if (url.pathname === "/__test/progress" && request.method === "POST") {
      const body = await readBody(request);
      state.progress.set(learnerId, { ...body, user_id: learnerId });
      json(response, 200, { ok: true });
      return;
    }
    if (url.pathname === "/__test/state" && request.method === "GET") {
      json(response, 200, {
        progress: state.progress.get(learnerId) ?? null,
        writes: state.writes,
      });
      return;
    }
    if (url.pathname.startsWith("/auth/v1/")) {
      await authRoute(request, response, url);
      return;
    }
    if (url.pathname.startsWith("/rest/v1/")) {
      await restRoute(request, response, url);
      return;
    }
    json(response, 404, { message: `Unhandled route ${request.method} ${url.pathname}` });
  } catch (error) {
    json(response, 500, { message: error instanceof Error ? error.message : String(error) });
  }
});

mockServer.listen(mockPort, "127.0.0.1", () => {
  const nextMode = process.env.E2E_NEXT_MODE === "start" ? "start" : "dev";
  const child = spawn("npm", ["run", nextMode, "--", "-p", String(appPort)], {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${mockPort}`,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${appPort}`,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "9",
    },
  });

  const shutdown = () => {
    child.kill("SIGTERM");
    mockServer.close(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  child.once("exit", (code) => {
    mockServer.close(() => process.exit(code ?? 1));
  });
});
