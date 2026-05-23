import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Supervizion native Android (.apk) wrapper.
 *
 * 보안 정책 (P0-3): 비수탁 지갑은 원격 URL 로딩 금지. 서버 침해 시 시드 탈취
 * 위험이 있다. 따라서 `server.url` 을 두지 않고, 빌드된 정적 산출물을 APK 에
 * 로컬 번들링한다.
 *
 * TanStack Start (SSR) 는 정적 `dist/index.html` 을 내지 않으므로, 별도의
 * 클라이언트 전용(SPA/프리렌더) 빌드 산출물을 `capacitor-web/` 으로 복사한
 * 뒤 `npx cap sync android` 를 실행한다. (capacitor-web/index.html 은
 * 플레이스홀더 — 실제 빌드 산출물로 교체할 것.)
 */
const config: CapacitorConfig = {
  appId: "io.supervizion.wallet",
  appName: "Supervizion",
  webDir: "capacitor-web",
  backgroundColor: "#071f18",
  android: {
    allowMixedContent: false,
  },
  // server.url 의도적으로 미설정 — 원격 라이브 사이트를 로드하지 않는다.
};

export default config;
