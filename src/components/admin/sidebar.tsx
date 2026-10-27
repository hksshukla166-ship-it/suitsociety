"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, FolderTree, Tag, Layers, Warehouse,
  ShoppingCart, Users, Star, Image, Video, Heart, Ticket, Zap,
  Percent, BarChart3, Settings, LogOut, Menu, X, Upload, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { logoutAdmin } from "@/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/fabrics", label: "Fabrics", icon: Layers },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/hero", label: "Hero Slides", icon: Image },
  { href: "/admin/banners", label: "Banners", icon: Sparkles },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/happy-customers", label: "Happy Customers", icon: Heart },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
  { href: "/admin/discounts", label: "Discounts", icon: Percent },
  { href: "/admin/import", label: "Excel Import", icon: Upload },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAdmin();
    window.location.href = "/admin/login";
  };

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow">
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-luxury-black text-white z-40 transition-transform lg:translate-x-0 overflow-y-auto",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="font-serif text-xl tracking-widest">
            SUIT <span className="text-gold">SOCIETY</span>
          </Link>
          <p className="text-xs text-white/50 mt-1">Admin Panel</p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-gold/20 text-gold" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white w-full">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
