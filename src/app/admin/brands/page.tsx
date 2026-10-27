"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminBrandsPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Brands"
        description="Manage product brands"
        apiPath="/api/admin/brands"
        fields={[
          { key: "name", label: "Name", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "logo_url", label: "Logo URL", type: "url" },
          { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          {
            key: "is_active",
            label: "Status",
            render: (item) => (
              <span className={item.is_active ? "text-green-400" : "text-red-400"}>
                {item.is_active ? "Active" : "Inactive"}
              </span>
            ),
          },
        ]}
      />
    </AdminLayout>
  );
}
