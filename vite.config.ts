// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";

// Capacitor 빌드 시 BUILD_TARGET=capacitor 가 세팅됨
// - base: './' → APK 내부 파일 스킴에서 자산 상대경로 해결
// - tanstackStart.spa.enabled = true → 클라이언트 셸을 prerender 해
//   .output/public/index.html 을 생성. (서버 빌드에서는 SSR을 유지하기 위해
//   기본값을 건드리지 않는다.)
const isCapacitor = process.env.BUILD_TARGET === "capacitor";
const nodeModuleFile = (pkg: string, relativePath: string) =>
  fileURLToPath(new URL(`./node_modules/${pkg}/${relativePath}`, import.meta.url));

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
    plugins: [
      // SSR runs on Node — force `util` to the Node builtin so react-dom/server
      // doesn't pick up the npm `util` browser polyfill (transitive dep) which
      // lacks a constructable `TextEncoder` and breaks `renderToString`.
      {
        name: "lovable-ssr-node-builtins",
        enforce: "pre" as const,
        resolveId(id: string, _importer: string | undefined, opts: { ssr?: boolean }) {
          if (!opts?.ssr) return null;
          if (id === "util" || id === "node:util") return { id: "node:util", external: true };
          return null;
        },
      },
    ],
    base: isCapacitor ? "./" : "/",
    resolve: {
      alias: {
        // 일부 WalletConnect/Reown ESM 배포본이 Rollup 프로덕션 번들에서
        // 간헐적으로 파싱 실패한다. 브라우저에서도 동작하는 CJS 엔트리로
        // 고정해 dev/publish 경로를 동일하게 만든다.
        "@reown/walletkit": nodeModuleFile("@reown/walletkit", "dist/index.cjs"),
        "@walletconnect/core": nodeModuleFile("@walletconnect/core", "dist/index.cjs"),
        "@walletconnect/sign-client": nodeModuleFile("@walletconnect/sign-client", "dist/index.cjs"),
        "@walletconnect/types": nodeModuleFile("@walletconnect/types", "dist/index.cjs"),
        "@walletconnect/utils": nodeModuleFile("@walletconnect/utils", "dist/index.cjs"),
        "@walletconnect/pay": nodeModuleFile("@walletconnect/pay", "dist/index.cjs"),
        "@walletconnect/heartbeat": nodeModuleFile("@walletconnect/heartbeat", "dist/index.cjs.js"),
        "@walletconnect/jsonrpc-provider": nodeModuleFile(
          "@walletconnect/jsonrpc-provider",
          "dist/index.cjs.js",
        ),
        "@walletconnect/relay-auth": nodeModuleFile(
          "@walletconnect/relay-auth",
          "dist/index.cjs.js",
        ),
        // Browser polyfill for Node's `events` builtin used by @walletconnect/events.
        events: "events/",
        "node:events": "events/",
      },
    },
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
      // Vite 7 dev SSR (module-runner) — react 의 CJS index.js 가 module-runner
      // 의 ESM 평가 경로에 그대로 들어가면 `ReferenceError: module is not defined`
      // 가 난다. 사전 번들에 포함시켜 ESM 으로 변환된 버전이 쓰이도록 한다.
      // (배포 Worker 빌드는 noExternal:true 로 따로 처리되므로 영향 없음.)
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "react-dom",
          "react-dom/server",
          "react-dom/client",
          // CJS shim used by @tanstack/react-store — module-runner can't
          // evaluate the raw CJS, so force esbuild pre-bundling to ESM.
          "use-sync-external-store",
          "use-sync-external-store/shim",
          "use-sync-external-store/shim/with-selector",
          "@tanstack/react-store",
        ],
      },
    },
  },
});

