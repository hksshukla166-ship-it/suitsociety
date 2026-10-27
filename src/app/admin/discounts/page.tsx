"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminDiscountsPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Product Discounts"
        description="Manage product and category discounts"
        apiPath="/api/admin/discounts"
        fields={[
          { key: "name", label: "Discount Name", required: true },
          {
            key: "discount_type",
            label: "Discount Type",
            type: "select",
            required: true,
            options: [
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed Amount" },
            ],
            defaultValue: "percentage",
          },
          { key: "discount_value", label: "Discount Value", type: "number", required: true },
          { key: "product_id", label: "Product ID (optional)", placeholder: "UUID" },
          { key: "category_id", label: "Category ID (optional)", placeholder: "UUID" },
          { key: "starts_at", label: "Start Date", type: "datetime-local" },
          { key: "ends_at", label: "End Date", type: "datetime-local" },
          { key: "apply_to_new_products", label: "Apply to New Products", type: "checkbox", defaultValue: false },
          { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
        columns={[
          { key: "name", label: "Name" },
          {
            key: "discount_value",
            label: "Discount",
            render: (item) =>
              item.discount_type === "percentage"
                ? `${item.discount_value}%`
                : `₹${item.discount_value}`,
          },
          {
            key: "product",
            label: "Product",
            render: (item) => {
              const product = item.product as { name?: string } | null;
              return product?.name || "-";
            },
          },
          {
            key: "category",
            label: "Category",
            render: (item) => {
              const category = item.category as { name?: string } | null;
              return category?.name || "-";
            },
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
        emptyMessage="No discounts yet. Create your first product discount."
      />
    </AdminLayout>
  );
}
