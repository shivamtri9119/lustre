import { PageHeader } from "@/components/dashboard/page-header";
import { CustomerTable } from "@/components/customers/customer-table";

export default function CustomersPage() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Complete history, spend, and loyalty — searchable in one place."
      />
      <CustomerTable />
    </div>
  );
}
