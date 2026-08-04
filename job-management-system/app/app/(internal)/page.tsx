import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome{profile ? `, ${profile.fullName}` : ""}</h1>
        <p className="text-muted-foreground">
          Dashboard widgets (active jobs, revenue, outstanding invoices, stock value) will
          populate here as each phase ships.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">—</CardContent>
        </Card>
      </div>
    </div>
  );
}
