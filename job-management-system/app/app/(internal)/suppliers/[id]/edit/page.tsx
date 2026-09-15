import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupplierForm } from "../../supplier-form";
import { updateSupplier } from "../../actions";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", id).single();

  if (!supplier) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit supplier</h1>
      <SupplierForm action={updateSupplier.bind(null, id)} supplier={supplier} submitLabel="Save changes" />
    </div>
  );
}
