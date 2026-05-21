import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/wallet/AppShell";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal/disclaimer")({
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <AppShell title="면책 고지" subtitle="비수탁 지갑 위험 안내">
      <article className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={12} /> 설정으로
        </Link>

        <div className="rounded-3xl border border-red-500/40 bg-red-500/5 p-5 flex gap-3">
          <ShieldAlert className="text-red-500 shrink-0" size={22} />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-red-500 mb-1">
              본 앱은 비수탁(Non-custodial) 도구입니다
            </p>
            <p className="text-on-surface-variant">
              자산은 블록체인 상에 존재하며, 접근 권한은 오직 사용자의 시드 구문과
              비밀번호에 의해서만 결정됩니다. 운영자는 사용자의 자산·시드·비밀번호를
              <strong> 보관하지 않으며 복구·동결·환불할 수 없습니다.</strong>
            </p>
          </div>
        </div>

        <Section title="1. 시드 구문 및 비밀번호 관리">
          <p>
            12단어 시드 구문은 지갑의 <strong>유일한 백업</strong>입니다. 분실 시
            자산을 영구히 복구할 수 없습니다. 사진·스크린샷·클라우드 메모·이메일에
            저장하지 마시고, 종이에 기록하여 물리적으로 안전한 장소에 보관하세요.
          </p>
          <p>
            비밀번호는 시드를 이 기기에서 암호화하는 데 사용되며, 분실 시 복구
            절차는 "지갑 삭제 → 시드 구문으로 복구" 단 한 가지뿐입니다.
          </p>
        </Section>

        <Section title="2. 메인넷 전송 위험">
          <p>
            메인넷(Mainnet)에서의 트랜잭션은 <strong>되돌릴 수 없습니다.</strong>
            잘못된 주소·잘못된 체인·잘못된 금액 입력으로 인한 손실은 복구되지
            않습니다. 처음 전송하는 주소에는 항상 소액 테스트를 권장합니다.
          </p>
        </Section>

        <Section title="3. 네트워크 및 가스비">
          <p>
            트랜잭션 처리에는 네트워크별 수수료(가스비, 마이너 수수료)가 발생하며,
            네트워크 혼잡에 따라 처리 지연 또는 실패가 발생할 수 있습니다. 잔액이
            부족할 경우 트랜잭션은 거부됩니다.
          </p>
        </Section>

        <Section title="4. 외부 데이터 출처">
          <p>
            잔액·거래내역·가스비 추정·시세 정보는 mempool.space, 공개 RPC,
            Blockscout, CoinGecko 등 제3자 공개 API 로부터 조회됩니다. 데이터는
            지연되거나 부정확할 수 있으며, 항상 익스플로러 링크에서 최종 상태를
            확인하시기 바랍니다.
          </p>
        </Section>

        <Section title="5. 책임의 한계">
          <p>
            본 앱은 "있는 그대로(AS-IS)" 제공되며, 명시적·묵시적 어떠한 보증도
            하지 않습니다. 코드 결함, 라이브러리 취약점, 사용자 실수, 피싱·악성
            확장 프로그램, 기기 분실 등으로 인한 자산 손실에 대해 운영자는 책임을
            지지 않습니다.
          </p>
        </Section>

        <Section title="6. 규제 및 컴플라이언스">
          <p>
            대한민국 거주 사용자는 <strong>특정금융정보법</strong>(VASP) 및
            <strong> 가상자산이용자보호법</strong>의 적용을 받을 수 있습니다.
            100만원 상당 이상 가상자산 이전 시 트래블룰 대상이 될 수 있으니, 거래
            상대방·거래소의 정책을 별도로 확인하시기 바랍니다.
          </p>
        </Section>

        <p className="text-[11px] text-on-surface-variant text-center pt-4">
          본 면책 고지는 사전 통지 없이 갱신될 수 있습니다. 최종 업데이트: 2026-05
        </p>
      </article>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-outline bg-surface p-5">
      <h2 className="text-sm font-semibold mb-2">{title}</h2>
      <div className="text-xs text-on-surface-variant leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}
