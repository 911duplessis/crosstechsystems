import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id, name, company_name, customer_type, phone, email, city")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) {
    // PostgREST's .or() takes a mini filter-language string where `,()` are
    // structural — strip them from user input so a search term can't break
    // out of the intended filter or inject extra conditions.
    const term = q.replace(/[,()]/g, " ").trim();
    if (term) {
      query = query.or(`name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%`);
    }
  }

  const { data: customers } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button render={<Link href="/customers/new">New customer</Link>} />
      </div>

      <form className="max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, company, or email…"
          className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        />
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>City</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers?.length ? (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                      {customer.name}
                    </Link>
                    {customer.company_name && (
                      <div className="text-xs text-muted-foreground">{customer.company_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {customer.customer_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.phone ?? "—"}</TableCell>
                  <TableCell>{customer.email ?? "—"}</TableCell>
                  <TableCell>{customer.city ?? "—"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No customers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
