"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminColorsPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Colors"
        description="Manage product colors used in filters and product forms"
        apiPath="/api/admin/colors"
        fields={[{ key: "name", label: "Color Name", required: true }]}
        columns={[{ key: "name", label: "Color" }]}
        emptyMessage="No colors yet. Add Lavender, Rust, Off White, and more."
      />
    </AdminLayout>
  );
}
