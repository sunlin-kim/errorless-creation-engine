import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Supervizion native Android (.apk) wrapper.
 *
 * 보안 정책 (P0-3): 비수탁 지갑은 원격 URL 로딩 금지. 서버 침해 시 시드 탈취
 * 위험이 있다. 따라서 `server.url` 을 두지 않고, 빌드된 정적 산출물을 APK 에
 * 로컬 번들링한다.
 *
 * Origin 고정 (R1): WebView origin 이 매 실행마다 바뀌면 IndexedDB(vault) 가
 * 새 origin 에 묶여 "지갑이 사라진 것처럼" 보인다. 따라서 androidScheme=https
 * + hostname=localhost 로 고정해 https://localhost origin 을 유지한다.
 *
 * 외부 링크(익스플로러, vizionpower.supervizion.ai 등) 는 allowNavigation 에
 * 두지 않는다 — Capacitor 가 기본적으로 외부 브라우저(intent) 로 띄운다.
 * 앱 셸이 원격으로 대체되는 것을 막기 위함.
 */
const config: CapacitorConfig = {
  appId: "io.supervizion.wallet",
  appName: "Supervizion",
  webDir: "capacitor-web",
  backgroundColor: "#071f18",
  server: {
    androidScheme: "https",
    hostname: "localhost",
    cleartext: false,
    // allowNavigation 의도적으로 비움 — 외부 도메인은 외부 브라우저로 열림.
    // server.url 의도적으로 미설정 — 원격 라이브 사이트를 로드하지 않는다.
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
