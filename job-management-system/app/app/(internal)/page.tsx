import Link from "next/link";
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
  const canSeeStock = profile?.role === "admin" || profile?.role === "manager";

  let activeJobsQuery = supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .in("status", OPEN_STATUSES);
  if (profile?.role === "technician") {
    activeJobsQuery = activeJobsQuery.eq("assigned_technician_id", profile.id);
  }

  const [{ count: activeJobs }, outstanding, revenue, stock] = await Promise.all([
    activeJobsQuery,
    canSeeCommercials
      ? supabase.from("invoices").select("balance_due").in("status", ["unpaid", "partial", "overdue"])
      : Promise.resolve({ data: null }),
    canSeeCommercials
      ? supabase.from("invoices").select("amount_paid").neq("status", "cancelled")
      : Promise.resolve({ data: null }),
    canSeeStock
      ? supabase.from("products").select("stock_quantity, cost_price, min_stock_level").eq("is_active", true)
      : Promise.resolve({ data: null }),
  ]);

  const outstandingTotal = (outstanding.data ?? []).reduce((sum, row) => sum + row.balance_due, 0);
  const outstandingCount = outstanding.data?.length ?? 0;
  const revenueTotal = (revenue.data ?? []).reduce((sum, row) => sum + row.amount_paid, 0);
  const stockValue = (stock.data ?? []).reduce((sum, row) => sum + row.stock_quantity * row.cost_price, 0);
  const lowStockCount = (stock.data ?? []).filter((row) => row.stock_quantity <= row.min_stock_level).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome{profile ? `, ${profile.fullName}` : ""}</h1>
        <p className="text-muted-foreground">Monthly reports and best-selling products are a later phase.</p>
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

        {canSeeCommercials && (
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
        )}

        {canSeeStock && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Stock value
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{formatMoney(stockValue)}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low stock items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{lowStockCount}</div>
                {lowStockCount > 0 && (
                  <Link href="/products?low_stock=1" className="text-xs hover:underline">
                    View products
                  </Link>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
