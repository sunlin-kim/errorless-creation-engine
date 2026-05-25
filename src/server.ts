import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry({
  async fetch(request, env, ctx) {
    try {
      const response = await handler.fetch(request, env, ctx);
      return response;
    } catch (error) {
      console.error(error);
      return new Response(
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /><title>This page didn't load</title></head><body><div style=\"font:15px/1.5 system-ui,-apple-system,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center\"><div><h1 style=\"margin:0 0 8px\">This page didn't load</h1><p style=\"margin:0;color:#6b7280\">Something went wrong on our end. Try refreshing.</p></div></div></body></html>",
        {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
  },
});