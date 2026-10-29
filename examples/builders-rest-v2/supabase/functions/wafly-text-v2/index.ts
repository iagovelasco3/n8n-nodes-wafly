import { createHandler } from "../_shared/core.ts";
import { readServerKey } from "../_shared/environment.ts";

const get = (name: string) => Deno.env.get(name);

const handler = createHandler({
  origin: Deno.env.get("APP_ORIGIN") ?? "",
  ownerId: Deno.env.get("WAFLY_OWNER_USER_ID") ?? "",
  supabaseUrl: get("SUPABASE_URL") ?? "",
  publicKey: readServerKey(
    get,
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  ),
  secretKey: readServerKey(
    get,
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ),
  instance: Deno.env.get("WAFLY_INSTANCE_ID"),
  instanceToken: Deno.env.get("WAFLY_INSTANCE_TOKEN"),
  clientToken: Deno.env.get("WAFLY_CLIENT_TOKEN"),
  testPhone: Deno.env.get("WAFLY_TEST_PHONE"),
  dispatch: Deno.env.get("WAFLY_DISPATCH_ENABLED") === "true",
}, { fetch: globalThis.fetch.bind(globalThis) });
Deno.serve(handler);
