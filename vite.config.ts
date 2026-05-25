// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Capacitor 빌드 시 BUILD_TARGET=capacitor 가 세팅됨
// - base: './' → APK 내부 파일 스킴에서 자산 상대경로 해결
// - tanstackStart.spa.enabled = true → 클라이언트 셸을 prerender 해
//   .output/public/index.html 을 생성. (서버 빌드에서는 SSR을 유지하기 위해
//   기본값을 건드리지 않는다.)
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

export default defineConfig({
  // Capacitor 빌드는 정적 SPA 셸만 필요하므로 Cloudflare Worker 출력은 끈다.
  // (worker 어댑터가 켜져 있으면 prerender 가 dist/server/server.js 를 찾지 못함.)
  ...(isCapacitor ? { cloudflare: false as const } : {}),
  tanstackStart: {
    ...(isCapacitor
      ? {
          // SPA fallback shell — APK 로컬 번들이 어떤 경로로 진입해도 셸이 뜨도록
          // maskPath "/" 로 prerender → .output/public/index.html 생성.
          spa: {
            enabled: true,
            maskPath: "/",
          },
        }
      : {}),
  },

  vite: {
    base: isCapacitor ? "./" : "/",
    ssr: {
      // The deployed Cloudflare Worker (dynamic worker loader) has NO
      // node_modules at runtime, so every bare specifier MUST be inlined
      // into the SSR bundle. Setting ssr.external for npm packages
      // (including react/react-dom) causes runtime
      //   Error: No such module "X". imported from "server.js"
      // and a 502 on every request. Only node:* builtins may stay
      // external — the worker runtime resolves them natively.
      //
      // @reown/walletkit and @walletconnect/* are browser-only but are
      // loaded via dynamic import() guarded by `typeof window === "undefined"`,
      // so they are reachable in the SSR graph (and must be bundled) but
      // never executed on the server.
      noExternal: true,
    },
  },
});

