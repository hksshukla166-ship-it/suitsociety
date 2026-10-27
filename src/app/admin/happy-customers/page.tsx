"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminHappyCustomersPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Happy Customers"
        description="Manage customer gallery"
        apiPath="/api/admin/happy-customers"
        fields={[
          { key: "customer_name", label: "Customer Name" },
          { key: "image_url", label: "Photo", type: "image", bucket: "banners", required: true },
          { key: "caption", label: "Caption", type: "textarea" },
          { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
          { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
        columns={[
          { key: "customer_name", label: "Name" },
          { key: "caption", label: "Caption" },
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
