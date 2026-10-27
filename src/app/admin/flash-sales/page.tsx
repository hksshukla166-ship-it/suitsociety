"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminFlashSalesPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Flash Sales"
        description="Create and manage flash sale events"
        apiPath="/api/admin/flash-sales"
        fields={[
          { key: "title", label: "Sale Title", required: true },
          { key: "banner_url", label: "Banner Image", type: "image", bucket: "banners" },
          { key: "discount_percentage", label: "Discount %", type: "number", required: true },
          { key: "starts_at", label: "Start Date & Time", type: "datetime-local", required: true },
          { key: "ends_at", label: "End Date & Time", type: "datetime-local", required: true },
          { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
        columns={[
          { key: "title", label: "Title" },
          {
            key: "discount_percentage",
            label: "Discount",
            render: (item) => `${item.discount_percentage}%`,
          },
          {
            key: "starts_at",
            label: "Start",
            render: (item) =>
              item.starts_at
                ? new Date(String(item.starts_at)).toLocaleString("en-IN")
                : "-",
          },
          {
            key: "ends_at",
            label: "End",
            render: (item) =>
              item.ends_at
                ? new Date(String(item.ends_at)).toLocaleString("en-IN")
                : "-",
          },
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
        emptyMessage="No flash sales yet. Create your first flash sale."
      />
    </AdminLayout>
  );
}
