import { createFileRoute, redirect } from "@tanstack/react-router";

// 기존 mock 송금 화면은 제거. 실제 서명·방송 경로는 /wallet/send 로 통합.
export const Route = createFileRoute("/send")({
  beforeLoad: () => {
    throw redirect({ to: "/wallet/send" });
  },
});
