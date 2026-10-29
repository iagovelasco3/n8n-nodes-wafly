/** Existing authenticated app only. Keep this object across renders (e.g. useRef).
 * Bind each method to its own explicit user button, never mount/effect/timer.
 * Server stores the original key/time; no Wafly secret belongs here.
 */
type Client = {
  functions: {
    invoke: (
      name: string,
      args: { method: "GET" | "POST"; body?: object },
    ) => Promise<{ data?: unknown; error?: unknown }>;
  };
};
export function manualWaflyAction(supabase: Client, message: string) {
  let busy = false;
  const run = async (method: "GET" | "POST", body?: object) => {
    if (busy) {
      throw new Error(
        "Uma ação está em andamento. Aguarde antes de consultar ou recuperar.",
      );
    }
    busy = true;
    try {
      const { data, error } = await supabase.functions.invoke("wafly-text-v2", {
        method,
        ...(body ? { body } : {}),
      });
      if (error) {
        throw new Error(
          "Resultado não confirmado. Consulte o status; preserve a operação original.",
        );
      }
      return data; // Show state, delivery, expiresAt and nextAction; HTTP2xx alone is not delivery.
    } catch {
      throw new Error(
        "Resultado não confirmado. Consulte o status; preserve a operação original.",
      );
    } finally {
      busy = false;
    }
  };
  return {
    preview: () => run("POST", { action: "preview", message }),
    sendAuthorized: () =>
      run("POST", { action: "send", message, authorizedRecipient: true }),
    recoverAuthorized: () =>
      run("POST", { action: "recover", message, authorizedRecipient: true }),
    status: () => run("GET"),
  };
}
