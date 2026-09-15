import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserMenu } from "@/components/layout/user-menu";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // Middleware already redirects unauthenticated requests, but a direct data
  // fetch failure (e.g. profile row missing) must not silently render an
  // empty shell — fail closed back to login.
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/20 sm:block">
        <div className="border-b px-4 py-4 font-semibold">CrossTech Systems</div>
        <AppSidebar role={profile.role} />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b px-4">
          <UserMenu fullName={profile.fullName} role={profile.role} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
