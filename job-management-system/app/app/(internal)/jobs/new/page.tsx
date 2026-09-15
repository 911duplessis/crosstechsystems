import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string }>;
}) {
  const { customer_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: technicians }] = await Promise.all([
    supabase.from("customers").select("id, name, company_name").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "technician")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New job</h1>
      <NewJobForm
        customers={(customers ?? []).map((c) => ({
          id: c.id,
          label: c.company_name ? `${c.name} (${c.company_name})` : c.name,
        }))}
        technicians={(technicians ?? []).map((t) => ({ id: t.id, label: t.full_name }))}
        defaultCustomerId={customer_id}
      />
    </div>
  );
}
