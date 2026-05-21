# Supervizion — 모바일 앱 빌드 가이드

이 앱은 두 가지 방식으로 모바일 앱처럼 사용할 수 있습니다.

---

## 1) PWA (즉시 사용 가능, 별도 빌드 불필요)

이미 매니페스트(`public/manifest.webmanifest`)와 아이콘이 포함되어 있습니다.
앱을 배포(Publish)한 뒤 안드로이드 Chrome에서 접속:

1. 우측 상단 메뉴 → **"홈 화면에 추가"**
2. 홈 화면에서 아이콘 탭 → 전체화면(standalone) 으로 실행

- 주소창 없는 네이티브 앱 같은 UX
- 자동 업데이트 (배포만 하면 끝)
- 별도의 스토어 등록·서명 불필요

> Lovable 미리보기(iframe) 안에서는 PWA 설치가 동작하지 않습니다. **Publish 후 .lovable.app 도메인**에서 테스트하세요.

---

## 2) Capacitor로 진짜 .apk 빌드 (로컬 PC 필요)

`capacitor.config.ts`가 프로젝트 루트에 준비되어 있습니다.

### 사전 요구사항
- Node.js 20+
- **Android Studio** (최신 안정 버전)
- **JDK 17** (Android Studio에 내장 가능)
- 약 8GB 디스크 여유 공간

### 빌드 절차 (로컬 터미널에서 실행)

```bash
# 0. 프로젝트 클론 (GitHub 연동 후)
git clone <your-repo>
cd <project>
npm install

# 1. Capacitor 패키지 설치
npm i @capacitor/core @capacitor/cli @capacitor/android

# 2. 웹 앱 프로덕션 빌드
npm run build
# → dist/ (또는 .output/public/) 폴더 생성

# 3. 안드로이드 플랫폼 추가 (최초 1회)
npx cap add android

# 4. 빌드 결과 → 네이티브 프로젝트 동기화
npx cap sync

# 5. Android Studio 열기
npx cap open android
```

### Android Studio에서 APK 산출

1. Gradle Sync 완료 대기
2. 메뉴: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. 우측 하단 알림 "locate" 클릭
4. 결과물: `android/app/build/outputs/apk/debug/app-debug.apk`

### 서명된 릴리즈 APK (스토어 업로드용)
- **Build → Generate Signed Bundle / APK** → APK → 키스토어 생성 → release
- 결과물: `android/app/build/outputs/apk/release/app-release.apk`

### 코드 수정 후 재빌드
```bash
npm run build && npx cap sync android
```
그 후 Android Studio에서 다시 Build APK.

---

## 트러블슈팅

- **webDir 경로 오류**: TanStack Start가 `.output/public`에 빌드하면
  `capacitor.config.ts`의 `webDir`을 `".output/public"`으로 수정하세요.
- **흰 화면**: SSR/서버 함수에 의존하는 라우트는 정적 번들에서 동작하지 않습니다.
  네이티브 앱은 정적 셸 + API 호출 형태로 사용하세요.
- **권한**: 카메라/위치 등 추가 권한은 `android/app/src/main/AndroidManifest.xml`에서 선언.
