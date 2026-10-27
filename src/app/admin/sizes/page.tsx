"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminSizesPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Sizes"
        description="Manage product sizes from S through 7XL"
        apiPath="/api/admin/sizes"
        fields={[{ key: "name", label: "Size", required: true, placeholder: "e.g. XL, 3XL" }]}
        columns={[{ key: "name", label: "Size" }]}
        emptyMessage="No sizes yet. Default range is S to 7XL."
      />
    </AdminLayout>
  );
}
