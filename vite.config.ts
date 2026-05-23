// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Capacitor 빌드 시 BUILD_TARGET=capacitor 가 세팅됨 → base: './' 로 상대 경로 강제
// (APK 내부 파일 스킴에서 자산이 해결되도록).
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    base: isCapacitor ? "./" : "/",
  },
});
