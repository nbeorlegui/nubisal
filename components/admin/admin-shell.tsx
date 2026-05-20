"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

const menu = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Normativas",
    href: "/admin/documentos",
    icon: FileText,
  },
  {
    label: "Obras sociales",
    href: "/admin/obras-sociales",
    icon: Stethoscope,
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
    label: "Reportes",
    href: "/admin/reportes",
    icon: BarChart3,
  },
  {
    label: "Configuración",
    href: "/admin/configuracion",
    icon: Settings,
  },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f3f7fb] text-[#061f3d]">
      <MobileAdminMenu
        open={mobileOpen}
        pathname={pathname}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen">
        <aside
          className={[
            "sticky top-0 hidden h-screen shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 lg:block",
            collapsed ? "w-[72px]" : "w-[230px]",
          ].join(" ")}
        >
          <div className="mb-6 flex items-center justify-between">
            {!collapsed ? (
              <Image
                src="/brand/nubisal-logo.png"
                alt="Nubisal"
                width={150}
                height={42}
                className="h-auto w-[128px]"
                priority
              />
            ) : (
              <Image
                src="/brand/nubisal-cloud.png"
                alt="Nubisal"
                width={42}
                height={42}
                className="mx-auto h-auto w-10"
                priority
              />
            )}

            {!collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                title="Contraer menú"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {collapsed ? (
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                title="Expandir menú"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mb-7 px-2 text-xs text-slate-500">
              Panel administrador
            </p>
          )}

          <nav className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={[
                    "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition",
                    active
                      ? "bg-[#edf5ff] font-semibold text-[#062f73]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#061f3d]",
                    collapsed ? "justify-center px-0" : "",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link
              href="/logout"
              title={collapsed ? "Cerrar sesión" : undefined}
              className={[
                "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-600 transition hover:bg-red-50",
                collapsed ? "justify-center px-0" : "",
              ].join(" ")}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Cerrar sesión</span> : null}
            </Link>
          </div>
        </aside>

        <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600"
            title="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Image
            src="/brand/nubisal-logo.png"
            alt="Nubisal"
            width={140}
            height={40}
            className="h-auto w-[118px]"
            priority
          />

          <Link
            href="/logout"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Link>
        </div>

        <section className="min-w-0 flex-1 px-4 pb-4 pt-20 lg:px-5 lg:py-4">
          {children}
        </section>
      </div>
    </main>
  );
}

function MobileAdminMenu({
  open,
  pathname,
  onClose,
}: {
  open: boolean;
  pathname: string;
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

      <aside className="relative z-10 flex h-full w-[290px] flex-col bg-white px-4 py-5 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Image
            src="/brand/nubisal-logo.png"
            alt="Nubisal"
            width={150}
            height={42}
            className="h-auto w-[128px]"
            priority
          />

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            title="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-6 px-2 text-xs text-slate-500">
          Panel administrador
        </p>

        <nav className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition",
                  active
                    ? "bg-[#edf5ff] font-semibold text-[#062f73]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#061f3d]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <Link
            href="/logout"
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}