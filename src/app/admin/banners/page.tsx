"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminBannersPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Banners"
        description="Manage promotional banners"
        apiPath="/api/admin/banners"
        fields={[
          { key: "title", label: "Title" },
          { key: "subtitle", label: "Subtitle" },
          { key: "image_url", label: "Banner Image", type: "image", bucket: "banners", required: true },
          { key: "link_url", label: "Link URL", type: "url" },
          { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
          { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
        columns={[
          { key: "title", label: "Title" },
          { key: "subtitle", label: "Subtitle" },
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
