import { FileText, Trash2, Upload } from "lucide-react";
import AdminShell from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createDocumentAction,
  deleteDocumentAction,
  updateDocumentAction,
} from "./actions";

export default async function AdminDocumentsPage() {
  await requireAdmin();

  const [documents, healthInsurances] = await Promise.all([
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        healthInsurance: true,
        uploadedBy: true,
      },
    }),
    prisma.healthInsurance.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminShell>
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12b8c8]">Administración</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">Normativas</h1>
          <p className="mt-0.5 text-xs text-slate-500">Vista general de todos los documentos normativos cargados y procesados.</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#062f73]" />
              <h2 className="text-base font-semibold">Cargar normativa</h2>
            </div>

            <form
              action={async (formData) => {
                "use server";
                await createDocumentAction(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium">Título</label>
                <input
                  name="title"
                  required
                  placeholder="Ej: Normativa PAMI pañales"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-base outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Obra social</label>
                <select
                  name="healthInsuranceId"
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-base outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Seleccionar obra social</option>
                  {healthInsurances.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}{item.code ? ` (${item.code})` : ""}{!item.isActive ? " - Inactiva" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Archivo de normativa</label>
                <input
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.docx,.txt,.md,.csv,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/rtf,text/rtf"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base md:text-sm"
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  El archivo se guarda en Cloudinary y el texto procesado queda en la base para las consultas del bot.
                </p>
              </div>

              <button type="submit" className="h-11 w-full rounded-xl bg-[#062f73] text-sm font-semibold text-white hover:bg-[#05275f]">
                Cargar documento
              </button>
            </form>
          </article>

          <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#062f73]" />
              <div>
                <h2 className="text-base font-semibold">Documentos cargados</h2>
                <p className="text-xs text-slate-500">
                  {documents.length} normativa{documents.length === 1 ? "" : "s"} registrada{documents.length === 1 ? "" : "s"}.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {documents.map((document: any) => {
                const isCloudinaryFile = document.filePath?.includes("res.cloudinary.com") ?? false;

                return (
                  <div key={document.id} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-3 flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{document.title}</p>
                        <p className="mt-0.5 break-words text-xs text-slate-500">
                          {document.healthInsurance?.name ?? "Sin obra social"} · {document.fileName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">Cargado por {document.uploadedBy?.name ?? "Usuario"}</p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={["rounded-full px-3 py-1 text-xs font-semibold", document.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-500"].join(" ")}>
                            {document.isActive ? "Activo" : "Inactivo"}
                          </span>
                          <span className={["rounded-full px-3 py-1 text-xs font-semibold", isCloudinaryFile ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"].join(" ")}>
                            {isCloudinaryFile ? "Cloudinary" : "Local"}
                          </span>
                        </div>

                        {document.filePath ? (
                          <a href={document.filePath} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[#062f73] hover:underline">
                            Ver archivo original
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <details className="rounded-xl border border-slate-200 bg-white p-3">
                      <summary className="cursor-pointer text-sm font-medium">Editar documento</summary>

                      <form
                        action={async (formData) => {
                          "use server";
                          await updateDocumentAction(formData);
                        }}
                        className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_130px_auto]"
                      >
                        <input type="hidden" name="id" value={document.id} />
                        <input
                          name="title"
                          required
                          defaultValue={document.title}
                          className="h-10 rounded-xl border border-slate-200 px-3 text-base outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
                        />
                        <select
                          name="healthInsuranceId"
                          required
                          defaultValue={document.healthInsuranceId ?? ""}
                          className="h-10 rounded-xl border border-slate-200 px-3 text-base outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
                        >
                          <option value="" disabled>Seleccionar</option>
                          {healthInsurances.map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {item.name}{item.code ? ` (${item.code})` : ""}
                            </option>
                          ))}
                        </select>
                        <select
                          name="isActive"
                          defaultValue={String(document.isActive)}
                          className="h-10 rounded-xl border border-slate-200 px-3 text-base outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                        <button type="submit" className="h-10 rounded-xl bg-[#062f73] px-4 text-sm font-semibold text-white hover:bg-[#05275f]">
                          Guardar
                        </button>
                      </form>

                      <form
                        action={async (formData) => {
                          "use server";
                          await deleteDocumentAction(formData);
                        }}
                        className="mt-3"
                      >
                        <input type="hidden" name="id" value={document.id} />
                        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 hover:bg-red-100">
                          <Trash2 className="h-4 w-4" />
                          Eliminar documento
                        </button>
                      </form>
                    </details>
                  </div>
                );
              })}

              {documents.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Todavía no hay documentos cargados.</div>
              ) : null}
            </div>
          </article>
        </section>
      </section>
    </AdminShell>
  );
}
