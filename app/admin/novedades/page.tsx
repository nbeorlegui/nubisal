import { Bell, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/admin/admin-shell";
import {
  createNewsAction,
  deleteNewsAction,
  updateNewsAction,
} from "./actions";

export default async function AdminNewsPage() {
  const user = await requireAdmin();

  const newsItems = await prisma.news.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AdminShell>
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12b8c8]">
            Administración
          </p>

          <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">
            Novedades
          </h1>

          <p className="mt-0.5 text-xs text-slate-500">
            Comunicaciones visibles para los usuarios de sucursal.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold">Nueva novedad</h2>

            <form action={createNewsAction} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Título
                </label>

                <input
                  name="title"
                  placeholder="Ej: Actualización PAMI"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Descripción
                </label>

                <textarea
                  name="description"
                  rows={4}
                  placeholder="Detalle breve de la novedad..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <button
                type="submit"
                className="h-11 w-full rounded-xl bg-[#062f73] text-sm font-semibold text-white hover:bg-[#05275f]"
              >
                Crear novedad
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#062f73]" />
              <h2 className="text-base font-semibold">Listado</h2>
            </div>

            <div className="space-y-3">
              {newsItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-200 text-slate-500",
                      ].join(" ")}
                    >
                      {item.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <details className="rounded-xl border border-slate-200 bg-white p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Editar novedad
                    </summary>

                    <form action={updateNewsAction} className="mt-4 space-y-3">
                      <input type="hidden" name="id" value={item.id} />

                      <div className="grid gap-3 md:grid-cols-[1fr_130px_auto]">
                        <input
                          name="title"
                          defaultValue={item.title}
                          className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
                        />

                        <select
                          name="isActive"
                          defaultValue={String(item.isActive)}
                          className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
                        >
                          <option value="true">Activa</option>
                          <option value="false">Inactiva</option>
                        </select>

                        <button
                          type="submit"
                          className="h-10 rounded-xl bg-[#062f73] px-4 text-sm font-semibold text-white hover:bg-[#05275f]"
                        >
                          Guardar
                        </button>
                      </div>

                      <textarea
                        name="description"
                        defaultValue={item.description}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
                      />
                    </form>

                    <form action={deleteNewsAction} className="mt-3">
                      <input type="hidden" name="id" value={item.id} />

                      <button
                        type="submit"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar novedad
                      </button>
                    </form>
                  </details>
                </div>
              ))}

              {newsItems.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                  Todavía no hay novedades cargadas.
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </section>
    </AdminShell>
  );
}