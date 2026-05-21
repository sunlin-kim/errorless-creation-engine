import { useWalletStore } from "./wallet/store";

type Dict = Record<string, string>;

const ko: Dict = {
  // nav
  "nav.home": "홈",
  "nav.wallet": "내 지갑",
  "nav.points": "포인트",
  "nav.send": "보내기",
  "nav.receive": "받기",
  "nav.activity": "거래내역",
  "nav.settings": "설정",
  "nav.search": "자산·주소·트랜잭션 검색",
  "nav.notifications": "알림",
  "nav.mobile": "모바일 하단 내비게이션",

  // settings page
  "settings.title": "설정",
  "settings.subtitle": "보안 · 통화 · 법적 고지",
  "settings.security": "보안",
  "settings.currentStatus": "현재 상태",
  "settings.active": "이 기기에서 활성",
  "settings.notReady": "지갑 확인 중 또는 미설정",
  "settings.viewWallet": "지갑 보기",
  "settings.walletSetup": "지갑 설정",
  "settings.network": "네트워크",
  "settings.activeNetwork": "활성 네트워크",
  "settings.currentMode": "현재 모드:",
  "settings.mainnet": "메인넷",
  "settings.testnet": "테스트넷",
  "settings.switchNetwork": "지갑에서 네트워크 전환",
  "settings.networkNote":
    "지원: Ethereum (Mainnet · Sepolia), Bitcoin (Mainnet · Testnet), USDT (ERC-20), BNB Smart Chain, Solana.",
  "settings.region": "지역 및 통화",
  "settings.currency": "기본 통화",
  "settings.language": "언어",
  "settings.timezone": "시간대",
  "settings.legal": "법적 고지",
  "settings.legalBody":
    "본 앱은 비수탁(Non-custodial) 도구입니다. 시드 구문 및 개인키는 사용자 기기에만 존재하며, 운영자는 자산을 보관·복구·동결할 수 없습니다. 자산 손실에 대한 모든 책임은 사용자에게 있습니다.",
  "settings.legalLink": "전체 면책 고지 보기",
  "settings.seedTitle": "시드 구문 백업 보기",
  "settings.seedDesc":
    "누구에게도 공유하지 마세요. 노출되면 자산 전액 손실 위험이 있습니다. 조회 시 비밀번호를 한 번 더 확인합니다.",
  "settings.seedReveal": "시드 구문 조회",
  "settings.password": "비밀번호",
  "settings.cancel": "취소",
  "settings.confirm": "조회",
  "settings.checking": "확인 중...",
  "settings.hide": "숨기기",
  "settings.dangerTitle": "이 기기에서 지갑 삭제",
  "settings.dangerBody":
    "암호화된 시드를 이 기기에서 영구히 제거합니다. 시드 구문 백업이 없다면 자산을 복구할 수 없습니다.",
  "settings.deleteStart": "삭제 시작",
  "settings.deleteConfirm": "영구 삭제 확정",
  "settings.deleted": "지갑이 이 기기에서 삭제되었습니다",
  "settings.wrongPw": "비밀번호가 올바르지 않습니다",
  "settings.decryptFail": "복호화 실패",

  // wallet index
  "wallet.title": "내 지갑",
  "wallet.subtitlePrepare": "지갑을 준비하고 있습니다",
  "wallet.subtitleLocked": "지갑이 잠겨 있습니다",
  "wallet.subtitleNoWallet": "지갑을 만들거나 복구하세요",
  "wallet.noteLocked": "이 기기의 지갑을 사용하려면 비밀번호로 잠금을 해제하세요.",
  "wallet.noteNew": "이 기기에 아직 지갑이 없습니다. 새로 만들거나 시드로 복구할 수 있습니다.",
  "wallet.unlock": "잠금 해제",
  "wallet.manage": "지갑 관리",
  "wallet.setup": "지갑 설정",
  "wallet.subtitleLive": "비수탁 · {label} · 실시간 시세",
  "wallet.totalBalance": "Total Balance · 총 자산 (실시간)",
  "wallet.refresh": "새로고침",
  "wallet.hideBalance": "잔액 숨기기",
  "wallet.ethAddr": "지갑 주소 (ETH)",
  "wallet.activeAssets": "활성 자산",
  "wallet.chains": "chains",
  "wallet.mode": "모드",
  "wallet.holdings": "보유 자산",
  "wallet.assetsCount": "{n}개 · {mode}",
  "wallet.dataNote":
    "잔액은 온체인 RPC·mempool.space, 시세는 CoinGecko에서 실시간 조회됩니다.",
  "wallet.receiveAddrs": "받기 주소",
  "wallet.receiveAddrsSub": "체인별 입금 주소 (HD 파생)",
  "wallet.copy": "복사",
  "wallet.explorer": "익스플로러",

  // setup
  "setup.title": "지갑 설정",
  "setup.betaTitle": "⚠️ 베타 — 비수탁 지갑",
  "setup.warn1": "시드 구문은 본인 기기에만 저장됩니다. 분실 시 자산을 영구히 잃습니다.",
  "setup.warn2": "Supervizion 은 시드·비밀번호·자산을 보관하지 않으며 복구해드릴 수 없습니다.",
  "setup.warn3": "코드 결함으로 자산 손실이 발생할 수 있으며, 모든 책임은 사용자에게 있습니다.",
  "setup.warn4": "기본 네트워크는 테스트넷 입니다. 메인넷 전환은 추후 단계에서 별도 경고와 함께.",
  "setup.agree": "위 내용을 모두 읽었으며, 비수탁 지갑의 위험을 이해하고 동의합니다.",
  "setup.create": "새 지갑 생성",
  "setup.restore": "시드로 기존 지갑 복구",
  "setup.later": "나중에 하기 (데모 화면으로)",
  "setup.existingTitle": "이 기기에 이미 지갑이 있습니다",
  "setup.existingDesc": "기존 비밀번호로 잠금 해제하거나, 삭제 후 새로 만들 수 있습니다.",
  "setup.existingUnlock": "비밀번호로 잠금 해제",
  "setup.existingDelete": "삭제하고 새로 만들기",
  "setup.back": "뒤로",

  // unlock
  "unlock.tagline": "이 기기의 기존 지갑 불러오기",
  "unlock.passwordCheck": "기존 비밀번호 확인",
  "unlock.loadWallet": "지갑 불러오기",
  "unlock.forgot": "비밀번호를 잊으셨나요?",
  "unlock.resetWarn":
    "비밀번호 복구는 불가능합니다. 지갑을 삭제하고 시드 구문으로 다시 복구할 수 있습니다. 시드가 없으면 자산을 영구히 잃습니다.",
  "unlock.resetCancel": "취소",
  "unlock.resetConfirm": "지갑 삭제하고 복구",
  "unlock.home": "홈으로",
};

const en: Dict = {
  "nav.home": "Home",
  "nav.wallet": "My Wallet",
  "nav.points": "Points",
  "nav.send": "Send",
  "nav.receive": "Receive",
  "nav.activity": "Activity",
  "nav.settings": "Settings",
  "nav.search": "Search assets, addresses, transactions",
  "nav.notifications": "Notifications",
  "nav.mobile": "Mobile bottom navigation",

  "settings.title": "Settings",
  "settings.subtitle": "Security · Currency · Legal",
  "settings.security": "Security",
  "settings.currentStatus": "Current status",
  "settings.active": "Active on this device",
  "settings.notReady": "Checking wallet or not set up",
  "settings.viewWallet": "View wallet",
  "settings.walletSetup": "Set up wallet",
  "settings.network": "Network",
  "settings.activeNetwork": "Active network",
  "settings.currentMode": "Current mode:",
  "settings.mainnet": "Mainnet",
  "settings.testnet": "Testnet",
  "settings.switchNetwork": "Switch network in wallet",
  "settings.networkNote":
    "Supported: Ethereum (Mainnet · Sepolia), Bitcoin (Mainnet · Testnet), USDT (ERC-20), BNB Smart Chain, Solana.",
  "settings.region": "Region & Currency",
  "settings.currency": "Default currency",
  "settings.language": "Language",
  "settings.timezone": "Time zone",
  "settings.legal": "Legal notice",
  "settings.legalBody":
    "This app is a non-custodial tool. Your seed phrase and private keys exist only on your device; the operator cannot store, recover or freeze your assets. You are solely responsible for any asset loss.",
  "settings.legalLink": "View full disclaimer",
  "settings.seedTitle": "Reveal seed phrase backup",
  "settings.seedDesc":
    "Never share with anyone. Exposure risks total loss of funds. Your password is required again to reveal.",
  "settings.seedReveal": "Reveal seed phrase",
  "settings.password": "Password",
  "settings.cancel": "Cancel",
  "settings.confirm": "Reveal",
  "settings.checking": "Checking...",
  "settings.hide": "Hide",
  "settings.dangerTitle": "Delete wallet from this device",
  "settings.dangerBody":
    "Permanently removes the encrypted seed from this device. Without a seed backup you cannot recover your assets.",
  "settings.deleteStart": "Start deletion",
  "settings.deleteConfirm": "Confirm permanent deletion",
  "settings.deleted": "Wallet deleted from this device",
  "settings.wrongPw": "Incorrect password",
  "settings.decryptFail": "Decryption failed",

  "wallet.title": "My Wallet",
  "wallet.subtitlePrepare": "Preparing your wallet",
  "wallet.subtitleLocked": "Wallet is locked",
  "wallet.subtitleNoWallet": "Create or restore a wallet",
  "wallet.noteLocked": "Unlock with your password to use this device's wallet.",
  "wallet.noteNew": "No wallet on this device yet. Create a new one or restore from seed.",
  "wallet.unlock": "Unlock",
  "wallet.manage": "Manage wallet",
  "wallet.setup": "Set up wallet",
  "wallet.subtitleLive": "Non-custodial · {label} · live prices",
  "wallet.totalBalance": "Total Balance (live)",
  "wallet.refresh": "Refresh",
  "wallet.hideBalance": "Hide balance",
  "wallet.ethAddr": "Wallet address (ETH)",
  "wallet.activeAssets": "Active assets",
  "wallet.chains": "chains",
  "wallet.mode": "Mode",
  "wallet.holdings": "Holdings",
  "wallet.assetsCount": "{n} assets · {mode}",
  "wallet.dataNote":
    "Balances from on-chain RPC & mempool.space; prices from CoinGecko in real time.",
  "wallet.receiveAddrs": "Receive addresses",
  "wallet.receiveAddrsSub": "Per-chain deposit address (HD derived)",
  "wallet.copy": "Copy",
  "wallet.explorer": "Explorer",

  "setup.title": "Wallet setup",
  "setup.betaTitle": "⚠️ Beta — Non-custodial wallet",
  "setup.warn1":
    "Your seed phrase is stored only on your device. If lost, your assets are gone permanently.",
  "setup.warn2":
    "Supervizion does not store your seed, password or assets and cannot recover them for you.",
  "setup.warn3":
    "Code defects may cause asset loss; all responsibility lies with the user.",
  "setup.warn4":
    "Default network is testnet. Mainnet switch is done later with its own warning.",
  "setup.agree":
    "I have read the above and understand and accept the risks of a non-custodial wallet.",
  "setup.create": "Create new wallet",
  "setup.restore": "Restore existing wallet from seed",
  "setup.later": "Skip for now (go to demo)",
  "setup.existingTitle": "A wallet already exists on this device",
  "setup.existingDesc":
    "Unlock with your existing password, or delete it and create a new one.",
  "setup.existingUnlock": "Unlock with password",
  "setup.existingDelete": "Delete and create new",
  "setup.back": "Back",

  "unlock.tagline": "Load the existing wallet on this device",
  "unlock.passwordCheck": "Confirm existing password",
  "unlock.loadWallet": "Load wallet",
  "unlock.forgot": "Forgot your password?",
  "unlock.resetWarn":
    "Password recovery is impossible. You can delete the wallet and restore it from your seed phrase. Without the seed, your assets are gone forever.",
  "unlock.resetCancel": "Cancel",
  "unlock.resetConfirm": "Delete and restore",
  "unlock.home": "Home",
};

const dicts: Record<string, Dict> = { ko, en };

export function useT() {
  const lang = useWalletStore((s) => s.language);
  const dict = dicts[lang] ?? ko;
  return (key: string, vars?: Record<string, string | number>) => {
    let s = dict[key] ?? ko[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}
