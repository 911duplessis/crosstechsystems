import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, old_values, new_values, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = [...new Set((entries ?? []).map((e) => e.user_id).filter((id): id is string => !!id))];
  const { data: users } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string }[] };
  const userNames = new Map((users ?? []).map((u) => [u.id, u.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-muted-foreground">
          Role changes, job reassignments, and other sensitive actions. Read-only, populated
          entirely by database triggers.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries?.length ? (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{userNames.get(entry.user_id ?? "") ?? "System"}</TableCell>
                  <TableCell className="capitalize">{entry.action.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.entity_type} · {entry.entity_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                    {JSON.stringify(entry.old_values)} → {JSON.stringify(entry.new_values)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No audit events yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
