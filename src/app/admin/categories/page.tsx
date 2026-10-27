"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminCategoriesPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Categories"
        description="Manage shop categories and homepage thumbnails for Shop by Category"
        apiPath="/api/admin/categories"
        fields={[
          { key: "name", label: "Category Name", required: true },
          { key: "description", label: "Description", type: "textarea" },
          {
            key: "image_url",
            label: "Homepage Thumbnail",
            type: "image",
            bucket: "banners",
          },
          { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
          { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
        columns={[
          {
            key: "image_url",
            label: "Thumbnail",
            render: (item) =>
              item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={String(item.image_url)}
                  alt={String(item.name ?? "Category")}
                  className="h-10 w-10 rounded object-cover border border-white/10"
                />
              ) : (
                <span className="text-zinc-500 text-xs">No image</span>
              ),
          },
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "sort_order", label: "Order" },
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
        emptyMessage="No categories yet. Add categories to show them on the homepage Shop by Category section."
      />
    </AdminLayout>
  );
}
