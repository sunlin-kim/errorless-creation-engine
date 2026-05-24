# Supervizion — 모바일 앱 빌드 가이드

이 앱은 두 가지 방식으로 모바일 앱처럼 사용할 수 있습니다.

---

## 1) PWA (즉시 사용 가능, 별도 빌드 불필요)

이미 매니페스트(`public/manifest.webmanifest`)와 아이콘이 포함되어 있습니다.
앱을 배포(Publish)한 뒤 안드로이드 Chrome에서 접속:

1. 우측 상단 메뉴 → **"홈 화면에 추가"**
2. 홈 화면에서 아이콘 탭 → 전체화면(standalone) 으로 실행

> Lovable 미리보기(iframe) 안에서는 PWA 설치가 동작하지 않습니다. **Publish 후 .lovable.app 도메인**에서 테스트하세요.

---

## 2) Capacitor로 진짜 .apk 빌드 (로컬 PC 필요)

### 사전 요구사항 (반드시 이 버전 조합)

| 항목 | 버전 | 비고 |
| --- | --- | --- |
| Node.js | 20+ | LTS 권장 |
| Bun | 1.3+ | 본 저장소는 **bun** 을 공식 패키지 매니저로 사용. `bun.lock` 커밋됨 |
| JDK | **Temurin 17** | Gradle 8.13 / AGP 8.13 요구 사항 |
| Android SDK | API 36 (compile/target), platform-tools, build-tools 36.0.0 | Android Studio Koala 이상 또는 cmdline-tools |
| minSdk | 24 | `android/variables.gradle` |

#### 환경변수 설정 예시 (macOS / Linux, zsh)

```bash
# JDK 17 (Homebrew 예시)
brew install --cask temurin@17
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"

# Android SDK (Android Studio 가 설치한 위치)
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

java -version    # 17.x 가 떠야 함
sdkmanager --list | grep "platforms;android-36"
```

#### Windows (PowerShell)

```powershell
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17"
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
# 새 셸 열고 다시 시도
```

---

### 빌드 절차 (한 번에 재현 가능)

```bash
# 0. 의존성
bun install --frozen-lockfile

# 1. 웹 산출물 (절대 URL 차단 검증 포함)
bun run build:capacitor

# 2. 런처 아이콘 / 스플래시 생성 (필수, 1회 또는 아이콘 변경 시)
#    @capacitor/assets 는 빌드 산출물/런타임에 포함되지 않는 1회성 CLI 이므로
#    devDependencies 에 두지 않고 npx/bunx 로 on-demand 실행한다.
bunx -y @capacitor/assets@3 generate --android

# 3. 네이티브 동기화
bunx cap sync android

# 4. APK 빌드 (CLI)
cd android
./gradlew :app:assembleDebug --no-daemon
# 결과물: android/app/build/outputs/apk/debug/app-debug.apk
```

CI 에서 동일 흐름이 `.github/workflows/android.yml` 로 실행됩니다 — 푸시/PR 마다
APK 가 빌드되고 아티팩트로 업로드됩니다. JDK/SDK 설치는 워크플로 안에서
`actions/setup-java@v4` + `android-actions/setup-android@v3` 가 자동 수행합니다.

### Android Studio 에서 빌드 (GUI)

1. Android Studio 로 `android/` 폴더 열기
2. Gradle Sync 완료 대기
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### 서명된 릴리즈 APK

- **Build → Generate Signed Bundle / APK** → APK → 키스토어 생성 → release
- 결과물: `android/app/build/outputs/apk/release/app-release.apk`

### 코드/아이콘 수정 후 재빌드

```bash
bun run build:capacitor
bunx -y @capacitor/assets@3 generate --android   # 아이콘 변경 시
bunx cap sync android
cd android && ./gradlew :app:assembleDebug --no-daemon
```

---

## 보안 / 재현성 메모

- **lockfile**: 본 저장소는 `bun.lock` 을 단일 lockfile 로 사용합니다. `npm install`/`yarn install`/`pnpm install` 은 사용하지 마세요 (다른 lockfile 이 생기면 재현성이 깨집니다).
- **`@capacitor/assets`**: 일반 dev dependency 가 아닙니다. 런처 아이콘 생성용 1회성 CLI 이므로 `bunx -y @capacitor/assets@3 ...` 로만 실행하며, 의존성 트리에 포함되지 않습니다. (과거 dev audit 에서 잡히던 `tar / minimatch / uuid` 계열 경고도 함께 제거.)
- **FLAG_SECURE**: `MainActivity.java` 에서 강제. 화면 캡처/녹화 차단, 최근앱 썸네일 시드 잔상 제거.
- **원격 URL 미사용**: `capacitor.config.ts` 의 `server.url` 미설정 — APK 는 로컬 번들만 로드합니다. 서버 침해 시 시드 탈취 위험 차단.

---

## Troubleshooting

- **앱서랍에 안 보이고 검색해야 실행됨** → APK 내부 런처 리소스가 누락/오염되었거나, 이전 잘못된 설치본의 런처 캐시가 남아있는 경우입니다. 위 2단계 `@capacitor/assets generate --android` 를 다시 실행하고, 기기에서 앱 제거 후 재설치하세요.
- **흰 화면**: `bun run build:capacitor` 가 실패했거나 `capacitor-web/` 이 비어 있는 상태에서 `cap sync` 한 경우입니다. 로그를 확인하고 다시 빌드하세요.
- **`JAVA_HOME is not set ...`**: 위 "환경변수 설정 예시" 를 그대로 적용하세요. CI 에서는 자동 설치됩니다.
- **권한**: 카메라/위치 등 추가 권한은 `android/app/src/main/AndroidManifest.xml` 에서 선언.
