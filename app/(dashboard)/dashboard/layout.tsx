import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <DashboardSidebar username={session.username} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
