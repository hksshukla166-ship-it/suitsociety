"use client";



import { useCallback, useEffect, useState } from "react";

import { Loader2, MapPin } from "lucide-react";

import { toast } from "sonner";

import {

  AdminLayout,

  AdminHeader,

  AdminCard,

  AdminSelect,

} from "@/components/admin/AdminLayout";

import { formatPrice } from "@/lib/utils";

import { ORDER_STATUSES } from "@/lib/constants";



interface OrderItem {

  id: string;

  product_name: string;

  product_code?: string | null;

  size?: string | null;

  color?: string | null;

  quantity: number;

  price: number;

  total: number;

  product?: { barcode?: string; sku?: string };

}



interface Order {

  id: string;

  order_number: string;

  status: string;

  payment_status: string;

  total: number;

  shipping_name?: string;

  shipping_phone?: string;

  shipping_address?: string;

  shipping_city?: string;

  shipping_state?: string;

  shipping_pincode?: string;

  created_at: string;

  order_items?: OrderItem[];

  user?: { full_name?: string; phone?: string };

}



function getProductCode(item: OrderItem) {

  return item.product_code || item.product?.barcode || item.product?.sku || "-";

}



function formatShippingLocation(order: Order) {

  const parts = [

    order.shipping_address,

    order.shipping_city,

    order.shipping_state,

    order.shipping_pincode,

  ].filter(Boolean);

  return parts.length ? parts.join(", ") : null;

}



function getMapsUrl(order: Order) {

  const location = formatShippingLocation(order);

  if (!location) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

}



export default function AdminOrdersPage() {

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");



  const load = useCallback(() => {

    setLoading(true);

    const param = statusFilter ? `?status=${statusFilter}` : "";

    fetch(`/api/admin/orders${param}`)

      .then((r) => r.json())

      .then((d) => setOrders(d.data || []))

      .finally(() => setLoading(false));

  }, [statusFilter]);



  useEffect(() => {

    load();

  }, [load]);



  const updateStatus = async (id: string, status: string) => {

    const res = await fetch("/api/admin/orders", {

      method: "PUT",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ id, status }),

    });

    if (res.ok) {

      toast.success("Order status updated");

      load();

    } else {

      toast.error("Failed to update order");

    }

  };



  return (

    <AdminLayout>

      <AdminHeader title="Orders" description="Manage customer orders and view product details" />



      <div className="mb-6">

        <AdminSelect

          value={statusFilter}

          onChange={(e) => setStatusFilter(e.target.value)}

          className="max-w-xs"

        >

          <option value="">All Statuses</option>

          {ORDER_STATUSES.map((s) => (

            <option key={s} value={s}>

              {s.charAt(0).toUpperCase() + s.slice(1)}

            </option>

          ))}

        </AdminSelect>

      </div>



      <AdminCard>

        {loading ? (

          <div className="flex justify-center py-12">

            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />

          </div>

        ) : !orders.length ? (

          <p className="text-zinc-500 text-center py-8">No orders yet</p>

        ) : (

          <div className="space-y-4">

            {orders.map((order) => {

              const items = order.order_items || [];

              const shippingLocation = formatShippingLocation(order);

              const mapsUrl = getMapsUrl(order);



              return (

                <div key={order.id} className="border border-white/10 rounded-lg overflow-hidden">

                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

                    <div>

                      <p className="font-medium text-white">{order.order_number}</p>

                      <p className="text-zinc-400 text-sm">

                        {order.shipping_name || order.user?.full_name || "-"}

                        {" · "}

                        {order.shipping_phone || order.user?.phone}

                      </p>

                      <p className="text-zinc-500 text-xs mt-1">

                        {new Date(order.created_at).toLocaleDateString("en-IN", {

                          day: "numeric",

                          month: "short",

                          year: "numeric",

                          hour: "2-digit",

                          minute: "2-digit",

                        })}

                        {" · "}

                        {items.length} item{items.length !== 1 ? "s" : ""}

                      </p>

                      {shippingLocation && (

                        <div className="mt-2 flex items-start gap-1.5 text-sm text-zinc-400">

                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400/80" />

                          <div>

                            <p>{shippingLocation}</p>

                            {mapsUrl && (

                              <a

                                href={mapsUrl}

                                target="_blank"

                                rel="noopener noreferrer"

                                className="text-xs text-amber-400/90 hover:text-amber-300 mt-0.5 inline-block"

                              >

                                View on Google Maps

                              </a>

                            )}

                          </div>

                        </div>

                      )}

                    </div>



                    <div className="flex flex-wrap items-center gap-4 md:justify-end">

                      <div className="text-right">

                        <p className="font-medium text-amber-400">{formatPrice(order.total)}</p>

                        <p className="text-xs capitalize text-zinc-500">{order.payment_status}</p>

                      </div>

                      <AdminSelect

                        value={order.status}

                        onChange={(e) => updateStatus(order.id, e.target.value)}

                        className="text-xs py-1 min-w-[130px]"

                      >

                        {ORDER_STATUSES.map((s) => (

                          <option key={s} value={s}>

                            {s.charAt(0).toUpperCase() + s.slice(1)}

                          </option>

                        ))}

                      </AdminSelect>

                    </div>

                  </div>



                  {items.length > 0 && (

                    <div className="border-t border-white/10 bg-white/[0.02] px-4 py-3">

                      <table className="w-full text-sm">

                        <thead>

                          <tr className="text-zinc-500 text-xs">

                            <th className="text-left py-2 pr-2">Product Name</th>

                            <th className="text-left py-2 pr-2">Size</th>

                            <th className="text-left py-2 pr-2">Product Code</th>

                            <th className="text-left py-2 pr-2">Color</th>

                            <th className="text-right py-2 pr-2">Qty</th>

                            <th className="text-right py-2">Total</th>

                          </tr>

                        </thead>

                        <tbody>

                          {items.map((item) => (

                            <tr key={item.id} className="border-t border-white/5 text-zinc-300">

                              <td className="py-2 pr-2 font-medium">{item.product_name}</td>

                              <td className="py-2 pr-2">{item.size || "-"}</td>

                              <td className="py-2 pr-2 font-mono text-xs text-amber-400/90">

                                {getProductCode(item)}

                              </td>

                              <td className="py-2 pr-2">{item.color || "-"}</td>

                              <td className="py-2 pr-2 text-right">{item.quantity}</td>

                              <td className="py-2 text-right">{formatPrice(item.total)}</td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              );

            })}

          </div>

        )}

      </AdminCard>

    </AdminLayout>

  );

}

