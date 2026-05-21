# Supervizion 웹 지갑 데모 UI 계획

업로드한 Supervizion 로고와 프롬프트의 Material 3 시멘틱 토큰을 그대로 적용한 **프리미엄 그린 톤 웹 지갑 데모 UI**를 구축합니다. 실제 블록체인 연동 없이 더미 데이터로 화면·플로우만 완성도 높게 보여줍니다.

## 스택

- TanStack Start (web_app 아티팩트 기본 템플릿)
- Tailwind CSS + CSS 변수로 M3 시멘틱 토큰 구현
- Pretendard (한국어) + Inter (영문/숫자 tnum)
- Lucide 아이콘 + 자체 토큰 일러스트
- 라이트/다크 테마 토글

## 디자인 토큰 (프롬프트 §5 그대로)

라이트: primary `#065F46`, primaryContainer `#D1FAE5`, surface `#F8FFFB`, premiumAccent `#D4AF37` 등 전 토큰을 CSS 변수로.
다크: primary `#34D399`, background `#071F18`, surface `#0B2A22` 등.
버튼 12dp, 카드 16dp, 잔액에 `font-feature-settings: "tnum"` 강제.

## 화면 구성 (좌측 사이드바 + 메인)

1. **온보딩/스플래시** — 업로드 로고 + "SEE BEYOND. LEAD AHEAD." 태그라인, 그린 글로우 배경.
2. **홈/대시보드**
   - 잔액 카드: primary→primaryContainer 그라데이션, 총 자산 KRW 환산 + tnum 숫자
   - 빠른 액션: 보내기 / 받기 / 스왑 / 스테이킹
   - 보유 자산 리스트 (BTC, ETH, USDT, SOL 등 더미)
   - 최근 거래 미리보기
3. **보내기 (Send)** — 풀스크린 시트 형태, 네트워크 선택 → 주소 → 금액 → 수수료(가스) 추정 → 컨펌
4. **받기 (Receive)** — QR + 주소 복사, 네트워크 칩
5. **자산 상세** — 차트(더미 SVG), 24h 변동, 거래내역 타임라인
6. **거래내역 (Activity)** — 필터(전체/송금/수신/스왑), pending/success/failed 상태 칩
7. **설정** — 보안(니모닉 백업, 생체인증), 통화, 언어, 테마, 법적고지(특금법/이용자보호법 안내)

## 엣지케이스/규제 UI 반영 (프롬프트 §2.3, §6.3)

- 송금 컨펌 화면에 트래블룰(100만원↑) 안내 배너
- 가스 급변 시 "수수료 재추정" 토스트 패턴
- 니모닉 노출은 풀스크린 + 블러+롱프레스 패턴
- 휴면/pending 자산 빈 상태 일러스트

## 컴포넌트

- `BalanceCard`, `AssetRow`, `ActionButton`, `NetworkChip`, `TxStatusBadge`, `ConfirmSheet`, `MnemonicReveal`, `QRCodeDisplay`, `ThemeToggle`, `SidebarNav`

## 파일 구조

```text
src/
  assets/supervizion-logo.png          (업로드 그대로 복사)
  styles/tokens.css                    (M3 시멘틱 토큰)
  components/wallet/*                  (위 컴포넌트들)
  routes/
    index.tsx        대시보드
    send.tsx         보내기 플로우
    receive.tsx      받기
    activity.tsx     거래내역
    asset.$id.tsx    자산 상세
    settings.tsx     설정
```

## 산출 범위 밖 (명시)

- 실제 지갑 생성/서명/체인 연동 없음 (UI 데모)
- APK 분석·치환 작업은 별도 (네이티브 영역)
- 다국어는 한국어 우선, 영문 라벨 병기 수준

승인하시면 바로 구축 시작합니다.
