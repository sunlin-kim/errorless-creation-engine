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
  tanstackStart: {
    server: { entry: "server" },
    // SPA fallback shell — APK 로컬 번들이 어떤 경로로 진입해도 셸이 뜨도록
    // maskPath "/" 로 prerender. Capacitor 빌드일 때만 활성화.
    ...(isCapacitor
      ? {
          spa: {
            enabled: true,
            maskPath: "/",
          },
        }
      : {}),
  },
  vite: {
    base: isCapacitor ? "./" : "/",
  },
});
