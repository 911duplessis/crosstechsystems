import { SupplierForm } from "../supplier-form";
import { createSupplier } from "../actions";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New supplier</h1>
      <SupplierForm action={createSupplier} submitLabel="Create supplier" />
    </div>
  );
}
