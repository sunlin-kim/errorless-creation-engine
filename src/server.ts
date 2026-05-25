import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry({
  async fetch(request) {
    try {
      return await handler.fetch(request);
    } catch (err) {
      const e = err as Error;
      console.error("[SSR ERROR]", e?.stack ?? e);
      return new Response(
        "SSR ERROR\n\n" + (e?.stack ?? String(e)),
        { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }
  },
});
