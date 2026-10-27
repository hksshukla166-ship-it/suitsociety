"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminLayout, AdminHeader, AdminCard } from "@/components/admin/AdminLayout";

interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  is_verified: boolean;
  created_at: string;
  orders?: { count: number }[];
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <AdminHeader title="Customers" description="View registered customers" />

      <AdminCard>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : !customers.length ? (
          <p className="text-zinc-500 text-center py-8">No customers yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-white/10">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Phone</th>
                  <th className="text-left py-3 px-2">Email</th>
                  <th className="text-left py-3 px-2">Orders</th>
                  <th className="text-left py-3 px-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 text-zinc-300">
                    <td className="py-3 px-2">{c.name || "-"}</td>
                    <td className="py-3 px-2">{c.phone}</td>
                    <td className="py-3 px-2">{c.email || "-"}</td>
                    <td className="py-3 px-2">{c.orders?.[0]?.count ?? 0}</td>
                    <td className="py-3 px-2">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
