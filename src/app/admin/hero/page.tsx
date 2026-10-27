"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminHeroPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Hero Slides"
        description="Manage homepage hero carousel"
        apiPath="/api/admin/hero"
        fields={[
          { key: "title", label: "Title" },
          { key: "subtitle", label: "Subtitle" },
          { key: "image_url", label: "Desktop Image", type: "image", bucket: "banners", required: true },
          { key: "mobile_image_url", label: "Mobile Image", type: "image", bucket: "banners" },
          { key: "link_url", label: "Link URL", type: "url" },
          { key: "button_text", label: "Button Text", defaultValue: "Shop Now" },
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
