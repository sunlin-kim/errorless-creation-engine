import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for wrapping Supervizion as a native Android (.apk) app.
 *
 * This app is built with TanStack Start (SSR), which does NOT produce a static
 * `dist/index.html`. Instead of bundling the web app inside the APK, the native
 * shell points at the already-deployed production URL. The .apk is a thin
 * wrapper around the live site.
 *
 * BUILD STEPS (run locally, NOT in Lovable):
 *
 *   npm install
 *   npm i @capacitor/core @capacitor/cli @capacitor/android
 *   npx cap add android        # first time only
 *   npx cap sync android
 *   npx cap open android
 *
 * Then in Android Studio:
 *   Build > Build Bundle(s) / APK(s) > Build APK(s)
 */
const config: CapacitorConfig = {
  appId: "io.supervizion.wallet",
  appName: "Supervizion",
  // webDir is required by Capacitor, but content actually loads from server.url.
  // The folder just needs to exist with an index.html placeholder.
  webDir: "capacitor-web",
  backgroundColor: "#071f18",
  android: {
    allowMixedContent: false,
  },
  server: {
    // The native app loads the live production site.
    url: "https://supervizion.ai",
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
