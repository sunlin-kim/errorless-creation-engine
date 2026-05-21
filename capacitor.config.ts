import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for wrapping Supervizion as a native Android (.apk) app.
 *
 * BUILD INSTRUCTIONS (run on your local machine, not in Lovable):
 *
 *   # 1. Install Capacitor deps
 *   npm i @capacitor/core @capacitor/cli @capacitor/android
 *
 *   # 2. Build the web app
 *   npm run build
 *
 *   # 3. Add the Android platform (first time only)
 *   npx cap add android
 *
 *   # 4. Sync web build into the native project
 *   npx cap sync
 *
 *   # 5. Open in Android Studio (needs Android Studio + JDK 17 installed)
 *   npx cap open android
 *
 *   # 6. In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
 *   #    The signed .apk lands in android/app/build/outputs/apk/
 *
 * NOTE: TanStack Start defaults to SSR. For a static native bundle, build the
 * client output and point `webDir` at it. If your build emits to a different
 * folder (e.g. `.output/public` for Nitro), update `webDir` below to match.
 */
const config: CapacitorConfig = {
  appId: "io.supervizion.wallet",
  appName: "Supervizion",
  webDir: "dist",
  backgroundColor: "#071f18",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
