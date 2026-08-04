import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { FULL_JOB_VISIBILITY_ROLES } from "@/lib/auth/roles";
import { OPEN_STATUSES } from "@/lib/jobs/status";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const canSeeCommercials = !!profile && FULL_JOB_VISIBILITY_ROLES.includes(profile.role);

  let activeJobsQuery = supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .in("status", OPEN_STATUSES);
  if (profile?.role === "technician") {
    activeJobsQuery = activeJobsQuery.eq("assigned_technician_id", profile.id);
  }

  const [{ count: activeJobs }, outstanding, revenue] = await Promise.all([
    activeJobsQuery,
    canSeeCommercials
      ? supabase.from("invoices").select("balance_due").in("status", ["unpaid", "partial", "overdue"])
      : Promise.resolve({ data: null }),
    canSeeCommercials
      ? supabase.from("invoices").select("amount_paid").neq("status", "cancelled")
      : Promise.resolve({ data: null }),
  ]);

  const outstandingTotal = (outstanding.data ?? []).reduce((sum, row) => sum + row.balance_due, 0);
  const outstandingCount = outstanding.data?.length ?? 0;
  const revenueTotal = (revenue.data ?? []).reduce((sum, row) => sum + row.amount_paid, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome{profile ? `, ${profile.fullName}` : ""}</h1>
        <p className="text-muted-foreground">
          Stock value and best-selling products populate once stock management (Phase 3) ships.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {profile?.role === "technician" ? "My active jobs" : "Active jobs"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeJobs ?? 0}</CardContent>
        </Card>

        {canSeeCommercials ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{formatMoney(outstandingTotal)}</div>
                <p className="text-xs text-muted-foreground">{outstandingCount} invoice(s)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue collected
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatMoney(revenueTotal)}</CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock value
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">—</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
