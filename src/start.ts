import { createStart, createMiddleware } from "@tanstack/react-start";

function renderFallbackErrorPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>This page didn't load</title></head><body><div style="font:15px/1.5 system-ui,-apple-system,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center"><div><h1 style="margin:0 0 8px">This page didn't load</h1><p style="margin:0;color:#6b7280">Something went wrong on our end. Try refreshing.</p></div></div></body></html>`;
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderFallbackErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
