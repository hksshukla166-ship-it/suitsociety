"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  Layers,
  Warehouse,
  ShoppingCart,
  Users,
  MessageSquare,
  Image,
  Film,
  Smile,
  Ticket,
  Zap,
  Percent,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Palette,
  Ruler,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/import", label: "Excel Import", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/fabrics", label: "Fabrics", icon: Layers },
  { href: "/admin/colors", label: "Colors", icon: Palette },
  { href: "/admin/sizes", label: "Sizes", icon: Ruler },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/hero", label: "Hero Slides", icon: Image },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/videos", label: "Videos", icon: Film },
  { href: "/admin/happy-customers", label: "Happy Customers", icon: Smile },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
  { href: "/admin/discounts", label: "Discounts", icon: Percent },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-400" />
          <span className="font-serif text-lg text-white">
            SUIT <span className="text-amber-400">SOCIETY</span>
          </span>
        </Link>
        <p className="text-xs text-zinc-500 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-amber-500/20 text-amber-400"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors mb-2">
          View Store →
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-lg text-white"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside className="hidden lg:block w-64 bg-zinc-950 border-r border-white/10 fixed inset-y-0 left-0">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950">
            <button className="absolute top-4 right-4 text-white" onClick={() => setMobileOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-900">
      <AdminSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

export function AdminHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-serif text-white">{title}</h1>
      {description && <p className="text-zinc-400 text-sm mt-1">{description}</p>}
    </div>
  );
}

export function AdminCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-zinc-950 border border-white/10 rounded-xl p-6", className)}>
      {children}
    </div>
  );
}

export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      {...props}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-amber-500 text-zinc-950 hover:bg-amber-400",
        variant === "secondary" && "bg-white/10 text-white hover:bg-white/20",
        variant === "danger" && "bg-red-500/20 text-red-400 hover:bg-red-500/30",
        props.className
      )}
    >
      {children}
    </button>
  );
}

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600",
        props.className
      )}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50",
        props.className
      )}
    />
  );
}

export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600",
        props.className
      )}
    />
  );
}

export function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: React.ElementType; trend?: string }) {
  return (
    <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-400 text-sm">{label}</span>
        <Icon className="w-5 h-5 text-amber-400" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend && <p className="text-xs text-zinc-500 mt-1">{trend}</p>}
    </div>
  );
}
