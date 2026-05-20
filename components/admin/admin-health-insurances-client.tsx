"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  FileText,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createHealthInsuranceAction,
  deleteDocumentFromHealthInsuranceAction,
  deleteHealthInsuranceAction,
  updateHealthInsuranceAction,
  uploadNormativeForHealthInsuranceAction,
} from "@/app/admin/obras-sociales/actions";

type DocumentItem = {
  id: string;
  title: string;
  fileName: string;
  isActive: boolean;
  createdAt: string;
};

type HealthInsuranceItem = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  documents: DocumentItem[];
};

type ToastState = {
  visible: boolean;
  message: string;
};

type ServerActionResult = {
  ok?: boolean;
  message?: string;
};

type ServerAction = (formData: FormData) => Promise<ServerActionResult | void>;

const SUPPORTED_FILE_TYPES = ".pdf,.docx,.txt,.md,.csv,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/rtf,text/rtf";

export default function AdminHealthInsurancesClient({
  items,
}: {
  items: HealthInsuranceItem[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HealthInsuranceItem | null>(
    null
  );
  const [uploadTarget, setUploadTarget] = useState<HealthInsuranceItem | null>(
    null
  );
  const [deletingHealthInsuranceId, setDeletingHealthInsuranceId] = useState<
    string | null
  >(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
  });

  const pageSize = 5;

  function showToast(message: string) {
    setToast({
      visible: true,
      message,
    });

    window.setTimeout(() => {
      setToast({
        visible: false,
        message: "",
      });
    }, 2000);
  }

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return items;

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(value) ||
        (item.code ?? "").toLowerCase().includes(value) ||
        (item.description ?? "").toLowerCase().includes(value)
      );
    });
  }, [items, search]);

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleDeleteHealthInsurance(item: HealthInsuranceItem) {
    const confirmed = window.confirm(
      `¿Eliminar la obra social "${item.name}"? También se eliminarán sus normativas asociadas. Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeletingHealthInsuranceId(item.id);

    try {
      const formData = new FormData();
      formData.append("id", item.id);

      const result = await deleteHealthInsuranceAction(formData);
      showToast(result?.message ?? "Obra social eliminada correctamente.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la obra social.";

      window.alert(message);
    } finally {
      setDeletingHealthInsuranceId(null);
    }
  }

  return (
    <>
      <Toast visible={toast.visible} message={toast.message} />

      <section className="space-y-3">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#12b8c8]">
                Administración
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                Obras sociales
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Alta, edición, estado y normativas asociadas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#062f73] px-4 text-sm font-semibold text-white hover:bg-[#05275f]"
            >
              <Plus className="h-4 w-4" />
              Crear obra social
            </button>
          </div>
        </header>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#062f73]" />
              <h2 className="text-base font-semibold">Listado</h2>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Buscar obra social..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            {paginated.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {item.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.code ?? "Sin código"}
                    </p>

                    {item.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        {item.description}
                      </p>
                    ) : null}

                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.documents.length} normativa
                      {item.documents.length === 1 ? "" : "s"} cargada
                      {item.documents.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600",
                      ].join(" ")}
                    >
                      {item.isActive ? "Habilitada" : "Deshabilitada"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#062f73] hover:bg-[#edf5ff]"
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadTarget(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#062f73] hover:bg-[#edf5ff]"
                      title="Cargar normativa"
                    >
                      <Upload className="h-4 w-4" />
                      Normativa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteHealthInsurance(item)}
                      disabled={deletingHealthInsuranceId === item.id}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {paginated.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                No se encontraron obras sociales.
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
            <span>
              Mostrando {paginated.length} de {filtered.length} · Página {page} de {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(value + 1, totalPages))
                }
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </article>
      </section>

      {createOpen ? (
        <HealthInsuranceModal
          title="Crear obra social"
          action={createHealthInsuranceAction}
          successMessage="Obra social creada correctamente."
          onSuccess={showToast}
          onClose={() => setCreateOpen(false)}
          onRefresh={() => router.refresh()}
        />
      ) : null}

      {editingItem ? (
        <HealthInsuranceModal
          title="Editar obra social"
          item={editingItem}
          action={updateHealthInsuranceAction}
          successMessage="Obra social actualizada correctamente."
          onSuccess={showToast}
          onClose={() => setEditingItem(null)}
          onRefresh={() => router.refresh()}
        />
      ) : null}

      {uploadTarget ? (
        <UploadNormativeModal
          item={uploadTarget}
          action={uploadNormativeForHealthInsuranceAction}
          successMessage="Normativa cargada correctamente."
          onSuccess={showToast}
          onClose={() => setUploadTarget(null)}
          onRefresh={() => router.refresh()}
        />
      ) : null}
    </>
  );
}

function Toast({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) {
  if (!visible) return null;

  return (
    <div className="fixed right-5 top-5 z-[70] flex min-w-[280px] items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xl">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
        <CheckCircle2 className="h-5 w-5" />
      </div>

      <span>{message}</span>
    </div>
  );
}

function HealthInsuranceModal({
  title,
  item,
  action,
  successMessage,
  onSuccess,
  onClose,
  onRefresh,
}: {
  title: string;
  item?: HealthInsuranceItem;
  action: ServerAction;
  successMessage: string;
  onSuccess: (message: string) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setSubmitting(true);
      const result = await action(formData);
      onClose();
      onSuccess(result?.message ?? successMessage);
      onRefresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la obra social.";

      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDocument(document: DocumentItem) {
    const confirmed = window.confirm(
      `¿Eliminar la normativa "${document.title}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeletingDocumentId(document.id);

    try {
      const formData = new FormData();
      formData.append("documentId", document.id);

      const result = await deleteDocumentFromHealthInsuranceAction(formData);
      onClose();
      onSuccess(result?.message ?? "Normativa eliminada correctamente.");
      onRefresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la normativa.";

      window.alert(message);
    } finally {
      setDeletingDocumentId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {item ? <input type="hidden" name="id" value={item.id} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <input
                name="name"
                defaultValue={item?.name ?? ""}
                className="field"
                placeholder="Ej: PAMI"
                required
              />
            </Field>

            <Field label="Código">
              <input
                name="code"
                defaultValue={item?.code ?? ""}
                className="field"
                placeholder="Ej: PAMI"
              />
            </Field>

            <Field label="Estado">
              <select
                name="isActive"
                defaultValue={String(item?.isActive ?? true)}
                className="field"
              >
                <option value="true">Habilitada</option>
                <option value="false">Deshabilitada</option>
              </select>
            </Field>
          </div>

          <Field label="Descripción / notas">
            <textarea
              name="description"
              defaultValue={item?.description ?? ""}
              rows={3}
              className="textarea-field"
              placeholder="Notas internas o descripción general de la obra social..."
            />
          </Field>

          {item ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#062f73]" />
                  <p className="text-sm font-semibold">Normativas asociadas</p>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {item.documents.length}
                </span>
              </div>

              <div className="space-y-2">
                {item.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#061f3d]">
                        {document.title}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {document.fileName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(document)}
                      disabled={deletingDocumentId === document.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      title="Eliminar normativa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {item.documents.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                    No hay normativas cargadas.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#062f73]" />
              <p className="text-sm font-semibold">
                Normativa inicial / nueva normativa
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título de normativa">
                <input
                  name="documentTitle"
                  className="field"
                  placeholder="Ej: Normativa general"
                />
              </Field>

              <Field label="Archivos de normativa">
                <input
                  name="files"
                  type="file"
                  accept={SUPPORTED_FILE_TYPES}
                  multiple
                  className="file-field"
                />
              </Field>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Podés cargar PDF, Word (.docx), TXT, MD, CSV o RTF. Si no cargás
              archivo, solo se guardan los datos de la obra social.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-[#062f73] text-sm font-semibold text-white hover:bg-[#05275f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function UploadNormativeModal({
  item,
  action,
  successMessage,
  onSuccess,
  onClose,
  onRefresh,
}: {
  item: HealthInsuranceItem;
  action: ServerAction;
  successMessage: string;
  onSuccess: (message: string) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setSubmitting(true);
      const result = await action(formData);
      onClose();
      onSuccess(result?.message ?? successMessage);
      onRefresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cargar la normativa.";

      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Cargar normativa</h3>
            <p className="mt-0.5 text-sm text-slate-500">{item.name}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="healthInsuranceId" value={item.id} />

          <Field label="Título">
            <input
              name="documentTitle"
              placeholder="Ej: Normativa pañales"
              className="field"
            />
          </Field>

          <Field label="Archivos de normativa">
            <input
              name="files"
              type="file"
              accept={SUPPORTED_FILE_TYPES}
              multiple
              className="file-field"
              required
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-[#062f73] text-sm font-semibold text-white hover:bg-[#05275f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Cargando..." : "Cargar normativa"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#061f3d]">
        {label}
      </span>

      {children}

      <style jsx>{`
        :global(.field) {
          height: 44px;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          padding: 0 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }

        :global(.textarea-field) {
          min-height: 92px;
          width: 100%;
          resize: none;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }

        :global(.file-field) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }

        :global(.field:focus),
        :global(.textarea-field:focus),
        :global(.file-field:focus) {
          border-color: #062f73;
          box-shadow: 0 0 0 4px rgb(239 246 255);
        }
      `}</style>
    </label>
  );
}
