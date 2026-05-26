"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Menu,
  Stethoscope,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

type AdminShellProps = {
  children: React.ReactNode;
};

type MenuItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    label: "Obras sociales",
    href: "/admin/obras-sociales",
    icon: Stethoscope,
  },
  {
    label: "Normativas",
    href: "/admin/documentos",
    icon: FileText,
  },
  {
    label: "Novedades",
    href: "/admin/novedades",
    icon: Bell,
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: Users,
  },
  {
    label: "Sucursales",
    href: "/admin/sucursales",
    icon: Building2,
  },
  {
    label: "Reportes",
    href: "/admin/reportes",
    icon: BarChart3,
  },
  {
    label: "Proyección",
    href: "/admin/proyeccion",
    icon: TrendingUp,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === href || pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminMenuLink({
  item,
  collapsed,
  onClick,
}: {
  item: MenuItem;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={[
        "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition",
        active
          ? "bg-[#edf5ff] text-[#062f73]"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#061f3d]",
        collapsed ? "justify-center px-0" : "",
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={[
        "hidden h-dvh shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col",
        collapsed ? "w-[82px]" : "w-[260px]",
      ].join(" ")}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-slate-100 px-4 py-4">
          <div
            className={[
              "flex items-center",
              collapsed ? "justify-center" : "justify-between gap-3",
            ].join(" ")}
          >
            <Link href="/admin/dashboard" className="min-w-0">
              {collapsed ? (
                <Image
                  src="/brand/nubisal-cloud.png"
                  alt="Nubisal"
                  width={44}
                  height={44}
                  priority
                  className="h-auto w-11"
                />
              ) : (
                <Image
                  src="/brand/nubisal-logo.png"
                  alt="Nubisal"
                  width={150}
                  height={42}
                  priority
                  className="h-auto w-[130px]"
                />
              )}
            </Link>

            {!collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                title="Contraer menú"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="mx-auto mt-4 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              title="Expandir menú"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#12b8c8]">
                Administración
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Panel interno Nubisal
              </p>
            </div>
          )}
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => (
            <AdminMenuLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 px-3 py-4">
          <Link
            href="/logout"
            title={collapsed ? "Cerrar sesión" : undefined}
            className={[
              "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50",
              collapsed ? "justify-center px-0" : "",
            ].join(" ")}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed ? <span>Cerrar sesión</span> : null}
          </Link>
        </div>
      </div>
    </aside>
  );
}

function MobileTopbar({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/admin/dashboard">
        <Image
          src="/brand/nubisal-logo.png"
          alt="Nubisal"
          width={140}
          height={40}
          priority
          className="h-auto w-[120px]"
        />
      </Link>

      <Link
        href="/logout"
        className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 text-red-600"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-5 w-5" />
      </Link>
    </header>
  );
}

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />

      <aside className="relative z-10 flex h-dvh w-[290px] max-w-[86vw] flex-col overflow-hidden bg-white shadow-2xl">
        <div className="shrink-0 border-b border-slate-100 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin/dashboard" onClick={onClose}>
              <Image
                src="/brand/nubisal-logo.png"
                alt="Nubisal"
                width={150}
                height={42}
                priority
                className="h-auto w-[130px]"
              />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#12b8c8]">
              Administración
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Panel interno Nubisal
            </p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => (
            <AdminMenuLink key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-100 px-3 py-4">
          <Link
            href="/logout"
            onClick={onClose}
            className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Cerrar sesión</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="h-dvh overflow-hidden bg-[#f3f7fb] text-[#061f3d]">
      <MobileTopbar onOpenMenu={() => setMobileMenuOpen(true)} />

      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex h-dvh overflow-hidden">
        <DesktopSidebar />

        <section className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-4 sm:py-4">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}