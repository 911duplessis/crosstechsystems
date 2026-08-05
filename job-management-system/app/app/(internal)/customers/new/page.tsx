import { CustomerForm } from "../customer-form";
import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New customer</h1>
      <CustomerForm action={createCustomer} submitLabel="Create customer" />
    </div>
  );
}
