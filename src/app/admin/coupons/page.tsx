"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminCouponsPage() {
  return (
    <AdminLayout>
      <AdminCrudPage
        title="Coupons"
        description="Manage discount coupon codes"
        apiPath="/api/admin/coupons"
        fields={[
          { key: "title", label: "Title", required: true },
          { key: "code", label: "Coupon Code", required: true, placeholder: "SAVE20" },
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
          { key: "min_order_value", label: "Min Order Value", type: "number", defaultValue: 0 },
          { key: "max_discount", label: "Max Discount", type: "number" },
          { key: "usage_limit", label: "Usage Limit", type: "number" },
          { key: "starts_at", label: "Start Date", type: "datetime-local" },
          { key: "ends_at", label: "End Date", type: "datetime-local" },
          { key: "is_active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
        columns={[
          { key: "code", label: "Code" },
          { key: "title", label: "Title" },
          {
            key: "discount_value",
            label: "Discount",
            render: (item) =>
              item.discount_type === "percentage"
                ? `${item.discount_value}%`
                : `₹${item.discount_value}`,
          },
          { key: "usage_count", label: "Used" },
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
        emptyMessage="No coupons yet. Create your first coupon."
      />
    </AdminLayout>
  );
}
