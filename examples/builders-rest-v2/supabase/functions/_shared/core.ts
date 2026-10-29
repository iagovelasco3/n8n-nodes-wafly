/** Server-only starter: one manual intent per owner. Importing never sends. */
export type Config = {
  origin: string;
  ownerId: string;
  supabaseUrl: string;
  publicKey: string;
  secretKey?: string;
  instance?: string;
  instanceToken?: string;
  clientToken?: string;
  testPhone?: string;
  dispatch?: boolean;
};
export type Dependencies = { fetch: typeof fetch; timeoutMs?: number };
type Row = {
  owner_id: string;
  operation_key: string | null;
  request_hash: string | null;
  scope_hash: string | null;
  created_at: string;
  provider_message_id: string | null;
  expires_at: string | null;
};
type Receipt = {
  messageId: string;
  instance: string;
  state: string;
  delivery: string;
  expiresAt: string;
  automaticRetry: false;
  replayed?: boolean;
};
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID = /^[a-f0-9]{24}$/;
const STATES = [
  "PROCESSING",
  "QUEUED",
  "ACCEPTED",
  "DELIVERED",
  "FAILED",
  "UNKNOWN",
];
const FIELDS =
  "owner_id,operation_key,request_hash,scope_hash,created_at,provider_message_id,expires_at";
const WINDOW = 23 * 60 * 60 * 1000;
function safeOrigin(s: string) {
  try {
    const u = new URL(s);
    return u.origin === s && u.protocol === "https:";
  } catch {
    return false;
  }
}
function safeSupabase(s: string) {
  try {
    const u = new URL(s);
    return u.origin === s && u.protocol === "https:" &&
      u.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}
const hash = async (s: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
export function createHandler(config: Config, dependencies: Dependencies) {
  const call = dependencies.fetch, timeout = dependencies.timeoutMs ?? 10_000;
  const cors = {
    "Access-Control-Allow-Origin": config.origin,
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
  const json = (status: number, body: object) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  const fail = (status: number, error: string) =>
    json(status, { error, automaticRetry: false });
  const request = (url: string, init: RequestInit = {}) =>
    call(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(timeout),
    });
  return async (req: Request): Promise<Response> => {
    if (
      !safeOrigin(config.origin) || !safeSupabase(config.supabaseUrl) ||
      !UUID.test(config.ownerId) || !config.publicKey
    ) {
      return new Response(JSON.stringify({ error: "setup_required" }), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }
    if (req.headers.get("origin") !== config.origin) {
      return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
        status: 403,
      });
    }
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (!["GET", "POST"].includes(req.method)) {
      return fail(405, "method_not_allowed");
    }
    // Never accept caller-controlled instance, phone, key, time or message ID.
    if (new URL(req.url).search) return fail(400, "query_not_allowed");
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ") || auth.length > 8192) {
      return fail(401, "sign_in_required");
    }
    try {
      const r = await request(config.supabaseUrl + "/auth/v1/user", {
        headers: { apikey: config.publicKey, Authorization: auth },
      });
      if (!r.ok) return fail(401, "invalid_session");
      const u = await r.json();
      if (u?.id !== config.ownerId) return fail(403, "owner_only");
    } catch {
      return fail(503, "session_check_unavailable");
    }
    let action = "status", message = "";
    if (req.method === "POST") {
      if (
        !(req.headers.get("content-type") ?? "").toLowerCase().startsWith(
          "application/json",
        )
      ) return fail(415, "json_required");
      let p: Record<string, unknown>;
      try {
        const reader = req.body?.getReader();
        if (!reader) return fail(400, "invalid_json");
        const chunks: Uint8Array[] = [];
        let length = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 8192) {
            await reader.cancel();
            return fail(413, "body_too_large");
          }
          chunks.push(value);
        }
        const raw = new Uint8Array(length);
        let offset = 0;
        for (const c of chunks) {
          raw.set(c, offset);
          offset += c.byteLength;
        }
        p = JSON.parse(new TextDecoder().decode(raw));
      } catch {
        return fail(400, "invalid_json");
      }
      if (
        !p || Array.isArray(p) || typeof p !== "object" ||
        Object.keys(p).some((k) =>
          !["action", "message", "authorizedRecipient"].includes(k)
        ) ||
        !["preview", "send", "recover"].includes(String(p.action)) ||
        typeof p.message !== "string" || !p.message.trim() ||
        p.message.length > 1000
      ) return fail(400, "invalid_operation");
      action = String(p.action);
      message = p.message; // Preserve original whitespace in the body and its fingerprint.
      if (
        action === "preview" || (action === "send" && config.dispatch !== true)
      ) {
        return json(200, {
          state: "preview",
          delivery: "not_observed",
          automaticRetry: false,
          notice:
            "Prévia: nenhuma mensagem enviada, sem reserva ou chamada à Wafly.",
        });
      }
      if (p.authorizedRecipient !== true) {
        return fail(400, "recipient_authorization_required");
      }
    }
    if (
      !config.secretKey ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(config.instance ?? "") ||
      !config.instanceToken ||
      !/^[A-Za-z0-9_-]{8,256}$/.test(config.instanceToken) ||
      !config.clientToken || /[\r\n]/.test(config.clientToken) ||
      !/^[1-9][0-9]{9,14}$/.test(config.testPhone ?? "")
    ) return fail(503, "private_setup_required");
    const dbHeaders: Record<string, string> = {
      apikey: config.secretKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    if (!config.secretKey.startsWith("sb_secret_")) {
      dbHeaders.Authorization = "Bearer " + config.secretKey;
    }
    const table = config.supabaseUrl + "/rest/v1/wafly_builder_first_attempts";
    const where = "?owner_id=eq." + encodeURIComponent(config.ownerId) +
      "&select=" + FIELDS;
    const scope = await hash(
      JSON.stringify([config.ownerId, config.instance, config.clientToken]),
    );
    const fingerprint = await hash(
      JSON.stringify([
        config.ownerId,
        config.instance,
        config.testPhone,
        message,
      ]),
    );
    let row: Row | undefined;
    try {
      if (action === "send") {
        const r = await request(table + "?select=" + FIELDS, {
          method: "POST",
          headers: dbHeaders,
          body: JSON.stringify({
            owner_id: config.ownerId,
            state: "reserved",
            operation_key: crypto.randomUUID(),
            request_hash: fingerprint,
            scope_hash: scope,
          }),
        });
        if (r.status === 409) {
          return fail(409, "operation_exists_use_status_or_explicit_recovery");
        }
        if (!r.ok) return fail(503, "reservation_failed_no_dispatch");
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length === 1) row = rows[0];
      } else {
        const r = await request(table + where, { headers: dbHeaders });
        if (!r.ok) return fail(503, "reservation_lookup_unavailable");
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length === 1) row = rows[0];
        if (Array.isArray(rows) && rows.length === 0) {
          return fail(404, "no_operation_reserved");
        }
      }
    } catch {
      return fail(503, "reservation_uncertain_no_dispatch");
    }
    if (!row || row.owner_id !== config.ownerId) {
      return fail(503, "invalid_reservation_no_dispatch");
    }
    // v1 rows have no key: preserve them, never invent recovery proof or reset the reservation.
    if (
      !row.operation_key || !UUID.test(row.operation_key) ||
      !row.request_hash || !row.scope_hash
    ) return fail(409, "legacy_attempt_requires_manual_reconciliation");
    if (row.scope_hash !== scope) {
      return fail(409, "configuration_changed_reconcile_original_operation");
    }
    const first = Date.parse(row.created_at), age = Date.now() - first;
    if (!Number.isFinite(first) || age < 0) {
      return fail(503, "invalid_original_attempt_time");
    }
    if (action !== "status" && row.request_hash !== fingerprint) {
      return fail(409, "original_body_required");
    }
    const api = "https://wafly.com.br/api-bridge-whats/instances/" +
      encodeURIComponent(config.instance!) +
      "/token/" + encodeURIComponent(config.instanceToken);
    const apiHeaders = {
      "Client-Token": config.clientToken,
      "Content-Type": "application/json",
    };
    const query = action === "status" ||
      (action === "recover" && row.provider_message_id !== null);
    if (query && !ID.test(row.provider_message_id ?? "")) {
      return fail(409, "message_id_unknown_explicit_recovery_required");
    }
    if (
      !query &&
      (age >= WINDOW ||
        (row.expires_at !== null && Date.parse(row.expires_at) <= Date.now()))
    ) return fail(410, "send_window_closed_reconcile_without_post");
    if (!query && config.dispatch !== true) {
      return fail(503, "sending_disabled_status_remains_available");
    }
    let r: Response;
    try {
      r = await request(
        api +
          (query
            ? "/messages/" + row.provider_message_id + "/status"
            : "/send-text"),
        {
          method: query ? "GET" : "POST",
          headers: query
            ? apiHeaders
            : { ...apiHeaders, "Idempotency-Key": row.operation_key },
          ...(!query
            ? { body: JSON.stringify({ phone: config.testPhone, message }) }
            : {}),
        },
      );
    } catch {
      return json(202, {
        state: "UNKNOWN",
        delivery: "not_observed",
        automaticRetry: false,
        nextAction: query
          ? "retry_status_get_later"
          : "explicit_recovery_with_original_body_within_window",
      });
    }
    if (!r.ok) {
      const errors: Record<number, string> = {
        400: "invalid_request",
        401: "credentials_refused",
        402: "access_requires_review",
        403: "access_refused",
        404: "receipt_or_instance_not_found_for_owner",
        409: "key_body_conflict_reconcile",
        410: "receipt_expired_reconcile",
        429: "rate_limited_no_automatic_retry",
        503: "confirmation_unavailable_keep_original_operation",
      };
      return fail(
        [400, 401, 402, 403, 404, 409, 410, 429, 503].includes(r.status)
          ? r.status
          : 502,
        errors[r.status] ?? "confirmation_unavailable_keep_original_operation",
      );
    }
    let b: Receipt;
    try {
      b = await r.json();
    } catch {
      return fail(502, "invalid_receipt_reconcile");
    }
    if (
      !b || !ID.test(b.messageId ?? "") || b.instance !== config.instance ||
      !STATES.includes(b.state) || b.automaticRetry !== false ||
      !Number.isFinite(Date.parse(b.expiresAt)) ||
      Date.parse(b.expiresAt) <= Date.now() ||
      (b.state === "DELIVERED"
        ? b.delivery !== "confirmed"
        : b.delivery !== "not_observed") ||
      (query && b.messageId !== row.provider_message_id)
    ) return fail(502, "mismatched_receipt_reconcile");
    const result = {
      messageId: b.messageId,
      instance: b.instance,
      state: b.state,
      delivery: b.delivery,
      expiresAt: b.expiresAt,
      automaticRetry: false,
      ...(typeof b.replayed === "boolean" ? { replayed: b.replayed } : {}),
      nextAction:
        "Use GET for status. Delivery is not reading. Never create another key to recover this intent.",
    };
    if (!query) {
      try {
        const update = await request(
          table + "?owner_id=eq." + encodeURIComponent(config.ownerId) +
            "&operation_key=eq." + row.operation_key +
            "&or=(provider_message_id.is.null,provider_message_id.eq." +
            b.messageId + ")&select=" + FIELDS,
          {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({
              provider_message_id: b.messageId,
              expires_at: b.expiresAt,
              updated_at: new Date().toISOString(),
            }),
          },
        );
        const rows = update.ok ? await update.json() : [];
        if (!Array.isArray(rows) || rows.length !== 1) {
          return json(r.status, {
            ...result,
            record: "reconciliation_required",
          });
        }
      } catch {
        return json(r.status, { ...result, record: "reconciliation_required" });
      }
    }
    return json(r.status, result);
  };
}
