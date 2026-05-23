# 로드맵 (이번 작업 범위 외)

다음 항목은 보안 강화 차기 스프린트에서 다룬다. 지금 구현하지 않는다.

## 1. KDF: PBKDF2 → Argon2id
- 현재: PBKDF2-SHA256, 210k iter (`src/lib/wallet/crypto.ts`).
- 전환: `@noble/hashes/argon2` 의 `argon2id` (m=64MB, t=3, p=1) 권장.
- 마이그레이션: 사용자가 다음 잠금 해제 시 새 KDF 로 재암호화 → vault v2 로 저장.
- 영향: 모바일(WebView) 메모리 64MB 사용 시 저사양 단말 검증 필요.

## 2. WebAuthn / 생체 잠금 해제
- 비밀번호 대신 (혹은 추가로) 단말 생체로 vault 해독.
- Android: Capacitor + `@capacitor-community/biometric-auth` 또는 WebAuthn
  Platform Authenticator.
- 시드 키는 여전히 사용자 비밀번호 기반 KDF 로 암호화하고, 생체는 비밀번호
  자체를 OS keystore (StrongBox) 에 봉인하는 데 사용.

## 3. 하드웨어 지갑 (Ledger/Trezor)
- USB-OTG / WebHID (Android Chrome) 또는 Bluetooth (Ledger Nano X).
- 시드를 앱이 보지 않는 모드 — 서명 요청만 위임.
- 기존 HD 경로 (`derive.ts`) 와 동일 경로로 주소 표시.

## 4. 의존성 자동 점검 (이미 일부 적용)
- CI 에 `bun audit` 단계 추가됨 (`.github/workflows/security.yml`).
- 차기: Dependabot / Renovate 로 PR 자동 생성.
