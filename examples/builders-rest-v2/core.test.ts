import { type Config, createHandler } from "./core.ts";
import { manualWaflyAction } from "./frontend-example.ts";
import { readServerKey } from "./supabase/functions/_shared/environment.ts";
const cfg: Config = {
  origin: "https://app.example",
  ownerId: "11111111-1111-4111-8111-111111111111",
  supabaseUrl: "https://stage.supabase.co",
  publicKey: "synthetic-public",
};
const assert = (v: unknown) => {
  if (!v) throw new Error("Assertion failed");
};
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://edge.example/wafly-text-v2", {
    method: "POST",
    headers: {
      origin: cfg.origin,
      authorization: "Bearer stage-own",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
const preview = { action: "preview", message: "Synthetic test only" };
function mock() {
  let auth = 0;
  const fetcher = (async (input: RequestInfo | URL) => {
    assert(String(input).endsWith("/auth/v1/user"));
    auth++;
    return new Response(JSON.stringify({ id: cfg.ownerId }));
  }) as typeof fetch;
  return { fetch: fetcher, count: () => auth };
}
Deno.test("preview authenticates but needs no Wafly/bank secrets and reserves nothing", async () => {
  const m = mock();
  const r = await createHandler(cfg, m)(req(preview));
  assert(
    r.status === 200 && (await r.json()).state === "preview" && m.count() === 1,
  );
});
Deno.test("disabled send stays preview without any dispatch", async () => {
  const m = mock();
  const r = await createHandler(cfg, m)(req({ action: "send", message: "x" }));
  assert(
    r.status === 200 && (await r.json()).state === "preview" && m.count() === 1,
  );
});
Deno.test("setup refuses insecure/foreign origins and unsafe Supabase URL", async () => {
  for (
    const patch of [{ origin: "http://app.example" }, {
      supabaseUrl: "https://evil.example",
    }, { ownerId: "not-an-id" }]
  ) {
    const m = mock();
    assert(
      (await createHandler({ ...cfg, ...patch }, m)(req(preview))).status ===
          503 && m.count() === 0,
    );
  }
  const m = mock();
  assert(
    (await createHandler(cfg, m)(
          req(preview, { origin: "https://other.example" }),
        )).status === 403 && m.count() === 0,
  );
});
Deno.test("CORS preflight has GET POST and no side effects", async () => {
  const m = mock();
  const r = await createHandler(cfg, m)(
    new Request("https://edge.example", {
      method: "OPTIONS",
      headers: { origin: cfg.origin },
    }),
  );
  assert(
    r.status === 204 &&
      r.headers.get("access-control-allow-methods") === "GET, POST, OPTIONS" &&
      m.count() === 0,
  );
});
Deno.test("caller cannot supply an instance, recipient, key, time or ID", async () => {
  for (
    const field of [
      "instance",
      "phone",
      "operationKey",
      "firstAttemptAt",
      "messageId",
    ]
  ) {
    const m = mock();
    assert(
      (await createHandler(cfg, m)(req({ ...preview, [field]: "injected" })))
            .status === 400 && m.count() === 1,
    );
  }
});
Deno.test("empty arrays malformed actions and oversized streams stop safely", async () => {
  for (
    const p of [null, [], {}, { ...preview, message: "" }, {
      ...preview,
      action: "status",
    }, { ...preview, message: "x".repeat(9000) }]
  ) {
    const m = mock();
    const r = await createHandler(cfg, m)(req(p));
    assert([400, 413].includes(r.status) && m.count() === 1);
  }
});
Deno.test("absent invalid or foreign auth never reaches database/API", async () => {
  const m = mock();
  const r = req(preview);
  r.headers.delete("authorization");
  assert((await createHandler(cfg, m)(r)).status === 401 && m.count() === 0);
  for (const status of [401, 200]) {
    const fetcher = (async () =>
      new Response(
        JSON.stringify({ id: "22222222-2222-4222-8222-222222222222" }),
        { status },
      )) as typeof fetch;
    assert(
      (await createHandler(cfg, { fetch: fetcher })(req(preview))).status ===
        (status === 401 ? 401 : 403),
    );
  }
});
Deno.test("modern key maps take precedence and malformed maps fail closed", () => {
  const values: Record<string, string> = {
    map: '{"default":"sb_secret_synthetic"}',
    single: "single",
    legacy: "legacy",
  };
  assert(
    readServerKey((k) => values[k], "map", "single", "legacy") ===
      "sb_secret_synthetic",
  );
  values.map = "{bad";
  assert(readServerKey((k) => values[k], "map", "single", "legacy") === "");
  delete values.map;
  assert(
    readServerKey((k) => values[k], "map", "single", "legacy") === "single",
  );
  delete values.single;
  assert(
    readServerKey((k) => values[k], "map", "single", "legacy") === "legacy",
  );
});
Deno.test("frontend methods are manual and status uses GET without body", async () => {
  const calls: { method: string; body?: object }[] = [];
  const client = {
    functions: {
      invoke: async (
        _name: string,
        args: { method: "GET" | "POST"; body?: object },
      ) => {
        calls.push(args);
        return { data: { state: "preview" } };
      },
    },
  };
  const action = manualWaflyAction(client, "same original text");
  assert(calls.length === 0);
  await action.preview();
  await action.sendAuthorized();
  await action.status();
  await action.recoverAuthorized();
  assert(
    calls.length === 4 && calls[2].method === "GET" && !calls[2].body &&
      calls[1].method === "POST",
  );
});

Deno.test('frontend suppresses raw SDK exceptions and releases its local lock', async () => {
  let calls = 0;
  const client = {functions: {invoke: async () => {calls++; throw new Error('PRIVATE_SYNTHETIC_TRANSPORT_DETAIL');}}};
  const action = manualWaflyAction(client, 'synthetic');
  for (const method of [action.sendAuthorized, action.status]) {
    try {await method(); throw new Error('Expected a safe failure');} catch (e) {
      assert(e instanceof Error && !e.message.includes('PRIVATE_SYNTHETIC_TRANSPORT_DETAIL') && e.message.includes('Consulte o status'));
    }
  }
  assert(calls === 2);
});
