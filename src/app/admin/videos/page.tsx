"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminVideosManager } from "@/components/admin/admin-videos-manager";

export default function AdminVideosPage() {
  return (
    <AdminLayout>
      <AdminVideosManager />
    </AdminLayout>
  );
}
