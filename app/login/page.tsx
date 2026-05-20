"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Eye, LockKeyhole, UserRound, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="h-screen overflow-hidden bg-[#f3f7fb] text-[#061f3d]">
      <div className="flex h-full flex-col items-center justify-center px-5 py-4">
        <section className="grid h-[570px] w-full max-w-6xl overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.09)] lg:grid-cols-2">
          <aside className="relative hidden overflow-hidden border-r border-slate-200 bg-white px-12 py-8 lg:flex lg:items-center lg:justify-center">
            <div className="absolute right-12 top-14 opacity-45">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 20 }).map((_, index) => (
                  <span
                    key={index}
                    className="h-1.5 w-1.5 rounded-full bg-[#d7e7f5]"
                  />
                ))}
              </div>
            </div>

            <div className="absolute left-16 bottom-20 h-10 w-10 rounded-full bg-[#dff1fb]" />

            <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center text-center">
              <div className="flex w-full justify-center">
                <Image
                  src="/brand/nubisal-cloud.png"
                  alt="Nubisal"
                  width={320}
                  height={250}
                  priority
                  className="h-auto w-[280px] object-contain"
                />
              </div>

              <div className="mt-3 flex w-full justify-center">
                <Image
                  src="/brand/nubisal-logo.png"
                  alt="Nubisal"
                  width={220}
                  height={70}
                  priority
                  className="h-auto w-[185px] object-contain"
                />
              </div>

              <div className="mt-8 w-full text-center">
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Plataforma cloud para farmacias y salud.
                </p>
              </div>
            </div>
          </aside>

          <section className="flex h-full items-center justify-center px-6 py-6 sm:px-10">
            <div className="w-full max-w-[430px]">
              <div className="mb-8 flex flex-col items-center lg:hidden">
                <Image
                  src="/brand/nubisal-cloud.png"
                  alt="Nubisal"
                  width={150}
                  height={120}
                  priority
                  className="h-auto w-[120px]"
                />

                <Image
                  src="/brand/nubisal-logo.png"
                  alt="Nubisal"
                  width={190}
                  height={60}
                  priority
                  className="mt-3 h-auto w-[165px]"
                />
              </div>

              <div className="mb-7">
                <h2 className="text-4xl font-semibold tracking-[-0.035em] text-[#061f3d]">
                  Iniciar sesión
                </h2>

                <p className="mt-2 text-base text-slate-500">
                  Ingresá tus credenciales.
                </p>
              </div>

              <form action={formAction} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#061f3d]">
                    Usuario
                  </label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="Ingresá tu usuario"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-sm text-[#061f3d] outline-none transition placeholder:text-slate-400 focus:border-[#061f3d] focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#061f3d]">
                    Contraseña
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Ingresá tu contraseña"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-sm text-[#061f3d] outline-none transition placeholder:text-slate-400 focus:border-[#061f3d] focus:ring-4 focus:ring-blue-50"
                    />

                    <Eye className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {state.error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {state.error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={pending}
                  className="h-12 w-full rounded-xl bg-[#062f73] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(6,47,115,0.20)] transition hover:bg-[#05275f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Validando..." : "Ingresar"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                <p>
                  Admin: <span className="font-medium text-slate-700">admin</span> / admin123
                </p>
                <p>
                  Usuario: <span className="font-medium text-slate-700">gbamba</span> / bamba
                </p>
              </div>
            </div>
          </section>
        </section>

        <footer className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span>Sistema privado de uso interno</span>
          <span className="h-1 w-1 rounded-full bg-[#12b8c8]" />
          <span>
            Desarrollado por{" "}
            <strong className="font-semibold text-[#062f73]">Pantech</strong>
          </span>
        </footer>
      </div>
    </main>
  );
}
