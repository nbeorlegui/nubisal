"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  createBranchAction,
  createUserAction,
  deleteBranchAction,
  deleteUserAction,
  updateBranchAction,
  updateUserAction,
} from "@/app/admin/usuarios/actions";

type BranchItem = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  isActive: boolean;
};

type UserItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  branchId: string | null;
  branch: {
    id: string;
    name: string;
  } | null;
};

type ToastState = {
  visible: boolean;
  message: string;
};

type ServerAction = (formData: FormData) => Promise<void>;

export default function AdminUsersBranchesClient({
  users,
  branches,
}: {
  users: UserItem[];
  branches: BranchItem[];
}) {
  const [userSearch, setUserSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createBranchOpen, setCreateBranchOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
  });

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

  const filteredUsers = useMemo(() => {
    const value = userSearch.trim().toLowerCase();

    if (!value) return users;

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(value) ||
        user.username.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        user.role.toLowerCase().includes(value) ||
        (user.branch?.name ?? "").toLowerCase().includes(value)
      );
    });
  }, [users, userSearch]);

  const filteredBranches = useMemo(() => {
    const value = branchSearch.trim().toLowerCase();

    if (!value) return branches;

    return branches.filter((branch) => {
      return (
        branch.name.toLowerCase().includes(value) ||
        (branch.code ?? "").toLowerCase().includes(value) ||
        (branch.city ?? "").toLowerCase().includes(value) ||
        (branch.province ?? "").toLowerCase().includes(value)
      );
    });
  }, [branches, branchSearch]);

  return (
    <>
      <Toast visible={toast.visible} message={toast.message} />

      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12b8c8]">
            Administración
          </p>

          <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">
            Usuarios y sucursales
          </h1>

          <p className="mt-0.5 text-xs text-slate-500">
            Gestioná accesos internos y sucursales operativas.
          </p>
        </header>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#062f73]" />
                <h2 className="text-base font-semibold">Usuarios</h2>
              </div>

              <button
                type="button"
                onClick={() => setCreateUserOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#062f73] px-4 text-sm font-semibold text-white hover:bg-[#05275f]"
              >
                <UserPlus className="h-4 w-4" />
                Crear usuario
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Buscar usuario..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {user.username} · {user.email}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {user.role} · {user.branch?.name ?? "Sin sucursal"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[11px] font-semibold",
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-500",
                        ].join(" ")}
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-[#062f73] hover:bg-[#edf5ff]"
                        title="Editar"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <form
                        action={deleteUserAction}
                        onSubmit={(event) => {
                          if (!window.confirm("¿Eliminar este usuario?")) {
                            event.preventDefault();
                          } else {
                            showToast("Usuario eliminado correctamente.");
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={user.id} />

                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  No se encontraron usuarios.
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#062f73]" />
                <h2 className="text-base font-semibold">Sucursales</h2>
              </div>

              <button
                type="button"
                onClick={() => setCreateBranchOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#062f73] px-4 text-sm font-semibold text-white hover:bg-[#05275f]"
              >
                <Plus className="h-4 w-4" />
                Crear sucursal
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={branchSearch}
                onChange={(event) => setBranchSearch(event.target.value)}
                placeholder="Buscar sucursal..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="space-y-2">
              {filteredBranches.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {branch.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {branch.code ?? "Sin código"} ·{" "}
                        {branch.city ?? "Sin ciudad"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {branch.address ?? "Sin dirección"} ·{" "}
                        {branch.province ?? "Sin provincia"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[11px] font-semibold",
                          branch.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-500",
                        ].join(" ")}
                      >
                        {branch.isActive ? "Activa" : "Inactiva"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditingBranch(branch)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-[#062f73] hover:bg-[#edf5ff]"
                        title="Editar"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <form
                        action={deleteBranchAction}
                        onSubmit={(event) => {
                          if (!window.confirm("¿Eliminar esta sucursal?")) {
                            event.preventDefault();
                          } else {
                            showToast("Sucursal eliminada correctamente.");
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={branch.id} />

                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}

              {filteredBranches.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  No se encontraron sucursales.
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </section>

      {createUserOpen ? (
        <UserModal
          title="Crear usuario"
          branches={branches}
          action={createUserAction}
          successMessage="Usuario creado correctamente."
          onSuccess={showToast}
          onClose={() => setCreateUserOpen(false)}
        />
      ) : null}

      {editingUser ? (
        <UserModal
          title="Editar usuario"
          user={editingUser}
          branches={branches}
          action={updateUserAction}
          successMessage="Usuario actualizado correctamente."
          onSuccess={showToast}
          onClose={() => setEditingUser(null)}
        />
      ) : null}

      {createBranchOpen ? (
        <BranchModal
          title="Crear sucursal"
          action={createBranchAction}
          successMessage="Sucursal creada correctamente."
          onSuccess={showToast}
          onClose={() => setCreateBranchOpen(false)}
        />
      ) : null}

      {editingBranch ? (
        <BranchModal
          title="Editar sucursal"
          branch={editingBranch}
          action={updateBranchAction}
          successMessage="Sucursal actualizada correctamente."
          onSuccess={showToast}
          onClose={() => setEditingBranch(null)}
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

function UserModal({
  title,
  user,
  branches,
  action,
  successMessage,
  onSuccess,
  onClose,
}: {
  title: string;
  user?: UserItem;
  branches: BranchItem[];
  action: ServerAction;
  successMessage: string;
  onSuccess: (message: string) => void;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setSubmitting(true);
      await action(formData);
      onClose();
      onSuccess(successMessage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el usuario.";

      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
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
          {user ? <input type="hidden" name="id" value={user.id} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <input
                name="name"
                defaultValue={user?.name ?? ""}
                className="field"
                placeholder="María López"
              />
            </Field>

            <Field label="Usuario">
              <input
                name="username"
                defaultValue={user?.username ?? ""}
                className="field"
                placeholder="maria"
              />
            </Field>

            <Field label="Email">
              <input
                name="email"
                type="email"
                defaultValue={user?.email ?? ""}
                className="field"
                placeholder="maria@empresa.com"
              />
            </Field>

            <Field label={user ? "Nueva contraseña" : "Contraseña"}>
              <input
                name="password"
                type="password"
                className="field"
                placeholder={user ? "Opcional" : "Obligatoria"}
              />
            </Field>

            <Field label="Rol">
              <select
                name="role"
                defaultValue={user?.role ?? "USER"}
                className="field"
              >
                <option value="ADMIN">Administrador</option>
                <option value="USER">Usuario</option>
              </select>
            </Field>

            <Field label="Sucursal">
              <select
                name="branchId"
                defaultValue={user?.branchId ?? ""}
                className="field"
              >
                <option value="">Sin sucursal</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Estado">
              <select
                name="isActive"
                defaultValue={String(user?.isActive ?? true)}
                className="field"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
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

function BranchModal({
  title,
  branch,
  action,
  successMessage,
  onSuccess,
  onClose,
}: {
  title: string;
  branch?: BranchItem;
  action: ServerAction;
  successMessage: string;
  onSuccess: (message: string) => void;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setSubmitting(true);
      await action(formData);
      onClose();
      onSuccess(successMessage);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la sucursal.";

      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
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
          {branch ? <input type="hidden" name="id" value={branch.id} /> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <input
                name="name"
                defaultValue={branch?.name ?? ""}
                className="field"
                placeholder="Sucursal Centro"
              />
            </Field>

            <Field label="Código">
              <input
                name="code"
                defaultValue={branch?.code ?? ""}
                className="field"
                placeholder="CENTRO"
              />
            </Field>

            <Field label="Dirección">
              <input
                name="address"
                defaultValue={branch?.address ?? ""}
                className="field"
                placeholder="Av. San Martín 123"
              />
            </Field>

            <Field label="Ciudad">
              <input
                name="city"
                defaultValue={branch?.city ?? ""}
                className="field"
                placeholder="Godoy Cruz"
              />
            </Field>

            <Field label="Provincia">
              <input
                name="province"
                defaultValue={branch?.province ?? ""}
                className="field"
                placeholder="Mendoza"
              />
            </Field>

            <Field label="Estado">
              <select
                name="isActive"
                defaultValue={String(branch?.isActive ?? true)}
                className="field"
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </Field>
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
        }

        :global(.field:focus) {
          border-color: #062f73;
          box-shadow: 0 0 0 4px rgb(239 246 255);
        }
      `}</style>
    </label>
  );
}