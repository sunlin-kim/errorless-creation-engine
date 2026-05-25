import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/wallet")({
  beforeLoad: () => {
    throw redirect({ to: "/wallet/" });
  },
  component: () => <Outlet />,
});
