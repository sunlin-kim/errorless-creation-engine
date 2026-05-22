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

`capacitor.config.ts`가 프로젝트 루트에 준비되어 있습니다.

### ⚠️ 중요: "앱이 설치는 되는데 홈/앱서랍에 아이콘이 안 보이고 검색해야 실행됨" 문제

이전 빌드의 `public/icon-*.png`는 정사각형이 아니어서(1122×1402 세로 로고)
Android 어댑티브 런처 아이콘 렌더링이 실패했습니다. 결과적으로 런처가 빈
아이콘으로 처리해 **앱서랍/홈에서 보이지 않고 "검색"으로만 실행**됩니다.

수정 완료 항목:
- `resources/icon.png` (1024×1024 정사각형, 불투명)
- `resources/icon-foreground.png` + `resources/icon-background.png` (어댑티브 아이콘)
- `resources/splash.png`, `resources/splash-dark.png` (2732×2732)
- `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` 정사각형 재생성

아래 빌드 절차에서 **`@capacitor/assets generate` 단계를 반드시 실행**하세요.
이미 잘못된 APK를 설치했다면 **기기에서 먼저 제거(또는 데이터 삭제)** 후 재설치하세요.
같은 `appId`로 덮어 설치할 경우 일부 런처가 깨진 아이콘 캐시를 유지합니다.

### 사전 요구사항
- Node.js 20+
- **Android Studio** (최신 안정 버전)
- **JDK 17** (Android Studio에 내장 가능)

### 빌드 절차 (로컬 터미널)

```bash
# 0. 프로젝트 클론 (GitHub 연동 후)
git clone <your-repo>
cd <project>
npm install

# 1. Capacitor + 아이콘 생성기 설치
npm i @capacitor/core @capacitor/cli @capacitor/android
npm i -D @capacitor/assets

# 2. 웹 앱 프로덕션 빌드
npm run build

# 3. 안드로이드 플랫폼 추가 (최초 1회)
npx cap add android

# 4. ★ 런처 아이콘 / 스플래시 생성 (필수!)
#    resources/icon.png + resources/splash.png 를 읽어
#    android/app/src/main/res/mipmap-*/, drawable-*/ 에 모든 해상도 자동 생성
npx @capacitor/assets generate --android

# 5. 동기화
npx cap sync android

# 6. Android Studio 열기
npx cap open android
```

### Android Studio에서 APK 산출

1. Gradle Sync 완료 대기
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. 결과물: `android/app/build/outputs/apk/debug/app-debug.apk`

### 서명된 릴리즈 APK
- **Build → Generate Signed Bundle / APK** → APK → 키스토어 생성 → release
- 결과물: `android/app/build/outputs/apk/release/app-release.apk`

### 코드/아이콘 수정 후 재빌드
```bash
npm run build
npx @capacitor/assets generate --android   # 아이콘 변경 시
npx cap sync android
```
그 후 Android Studio에서 다시 Build APK.

기기에서 테스트할 때는 **기존 앱 제거 → 새 APK 설치**를 권장합니다.

---

## 트russelshooting

- **앱서랍에 안 보이고 검색해야 실행됨** → 런처 아이콘이 비정상(투명/비정사각형).
  위 4단계(`@capacitor/assets generate --android`)를 실행했는지 확인. 기기에서
  앱 제거 후 재설치.
- **흰 화면**: `capacitor.config.ts`의 `server.url`이 가리키는 도메인이
  실제로 배포(Publish)되어 있어야 합니다. 현재 설정: `https://supervizion.ai`
- **권한**: 카메라/위치 등 추가 권한은
  `android/app/src/main/AndroidManifest.xml`에서 선언.
