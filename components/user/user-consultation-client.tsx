"use client";

import Image from "next/image";
import Link from "next/link";
import { searchNormativeAction } from "@/app/consulta/actions";
import type { ChatSearchResponse } from "@/app/consulta/actions";
import { useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";

type HealthInsurance = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
};

type NewsItem = {
  id: string;
  title: string;
  description: string;
  date: string;
};

type UserConsultationClientProps = {
  user: {
    name: string;
    role: string;
    branchName: string;
  };
  healthInsurances: HealthInsurance[];
  news: NewsItem[];
};

type ChatMessage = {
  id: number;
  type: "bot" | "user";
  text: string;
  meta?: string;
  sources?: ChatSearchResponse["sources"];
};

function SidebarButton({
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <button
      className={[
        "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition",
        active
          ? "bg-[#edf5ff] font-semibold text-[#062f73]"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#061f3d]",
        collapsed ? "justify-center px-0" : "",
      ].join(" ")}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? <span>{label}</span> : null}
    </button>
  );
}

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const menu = [
    { label: "Nueva consulta", icon: MessageCircle, active: true },
    { label: "Historial", icon: History },
    { label: "Obras sociales", icon: Stethoscope },
    { label: "Novedades", icon: Bell },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40"
      />

      <aside className="relative z-10 flex h-full w-[280px] flex-col bg-white px-4 py-5 shadow-2xl">
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
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-6 px-2 text-xs text-slate-500">Panel de consulta</p>

        <nav className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                onClick={onClose}
                className={[
                  "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition",
                  item.active
                    ? "bg-[#edf5ff] font-semibold text-[#062f73]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#061f3d]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
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

function ChatBubble({
  message,
  registerMessageRef,
}: {
  message: ChatMessage;
  registerMessageRef: (id: number, element: HTMLDivElement | null) => void;
}) {
  const isUser = message.type === "user";

  return (
    <div
      ref={(element) => registerMessageRef(message.id, element)}
      className={["flex min-w-0", isUser ? "justify-end" : "justify-start"].join(" ")}
    >
      <div
        className={[
          "max-w-[92%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm sm:max-w-[88%]",
          "min-w-0 overflow-hidden break-words",
          isUser
            ? "bg-[#062f73] text-white"
            : "border border-[#cfe0ff] bg-white text-slate-700",
        ].join(" ")}
      >
        <p className="whitespace-pre-line break-words">{message.text}</p>

        {message.sources && message.sources.length > 0 ? (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-[#062f73]">
              Fuentes encontradas
            </p>

            {message.sources.slice(0, 3).map((source, index) => (
              <div
                key={`${source.documentTitle}-${index}`}
                className="min-w-0 rounded-xl bg-slate-50 px-3 py-2"
              >
                <p className="break-words text-xs font-semibold text-[#061f3d]">
                  {source.healthInsuranceName} · {source.documentTitle}
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {source.pageNumber
                    ? `Página ${source.pageNumber}`
                    : "Página no identificada"}
                </p>

                <p className="mt-1 line-clamp-3 break-words text-[11px] leading-4 text-slate-500">
                  {source.excerpt}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {message.meta ? (
          <p
            className={[
              "mt-2 text-xs",
              isUser ? "text-blue-100" : "text-slate-400",
            ].join(" ")}
          >
            {message.meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function HealthInsuranceList({
  items,
  search,
  onSearchChange,
  onSelect,
}: {
  items: HealthInsurance[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (item: HealthInsurance) => void;
}) {
  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return items.slice(0, 6);
    }

    return items.filter((item) => {
      const name = item.name.toLowerCase();
      const code = item.code?.toLowerCase() ?? "";

      return name.includes(normalizedSearch) || code.includes(normalizedSearch);
    });
  }, [items, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar obra social..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base text-[#061f3d] outline-none transition placeholder:text-slate-400 focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
        />
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{search ? "Resultados" : "Más consultadas"}</span>
        <span>{filteredItems.length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="flex w-full items-center justify-between rounded-xl border border-cyan-100 bg-white px-3 py-2 text-left transition hover:border-[#12b8c8]/40 hover:bg-[#ecfeff]"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#061f3d]">
                {item.name}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {item.code ?? "Sin código"}
              </p>
            </div>

            <span
              className={[
                "ml-2 shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold",
                item.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700",
              ].join(" ")}
            >
              {item.isActive ? "Activa" : "Inactiva"}
            </span>
          </button>
        ))}

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-cyan-100 bg-white px-3 py-4 text-center text-xs text-slate-400">
            No se encontraron obras sociales.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NewsList({
  items,
  search,
  onSearchChange,
}: {
  items: NewsItem[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return items.slice(0, 5);
    }

    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.date.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [items, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar novedad..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base text-[#061f3d] outline-none transition placeholder:text-slate-400 focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
        />
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{search ? "Resultados" : "Principales"}</span>
        <span>{filteredItems.length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-violet-100 bg-white px-3 py-2"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <h4 className="text-[13px] font-semibold text-[#061f3d]">
                {item.title}
              </h4>

              <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {item.date}
              </span>
            </div>

            <p className="text-[11px] leading-4 text-slate-500">
              {item.description}
            </p>
          </article>
        ))}

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-violet-100 bg-white px-3 py-4 text-center text-xs text-slate-400">
            No se encontraron novedades.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function UserConsultationClient({
  user,
  healthInsurances,
  news,
}: UserConsultationClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [insuranceSearch, setInsuranceSearch] = useState("");
  const [newsSearch, setNewsSearch] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "bot",
      text: "Hola. Escribí tu consulta sobre obra social, normativa, receta, autorización o cobertura.",
      meta: "Las respuestas se basan en las normativas cargadas.",
    },
  ]);

  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  function registerMessageRef(id: number, element: HTMLDivElement | null) {
    messageRefs.current[id] = element;
  }

  function scrollToMessage(id: number, block: ScrollLogicalPosition = "start") {
    requestAnimationFrame(() => {
      messageRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block,
      });
    });
  }

  const menu = useMemo(
    () => [
      { label: "Nueva consulta", icon: MessageCircle, active: true },
      { label: "Historial", icon: History },
      { label: "Obras sociales", icon: Stethoscope },
      { label: "Novedades", icon: Bell },
    ],
    []
  );


  async function handleSend(text?: string) {
  const value = (text ?? query).trim();

  if (!value || searching) return;

  const userMessageId = Date.now();
  const loadingMessageId = userMessageId + 1;

  setMessages((current) => [
    ...current,
    {
      id: userMessageId,
      type: "user",
      text: value,
    },
    {
      id: loadingMessageId,
      type: "bot",
      text: "Buscando en las normativas cargadas...",
      meta: "Procesando consulta",
    },
  ]);

  setQuery("");
  setSearching(true);
  setTimeout(() => scrollToMessage(userMessageId, "end"), 80);

  try {
    const result = await searchNormativeAction(value);

    setMessages((current) =>
      current.map((message) =>
        message.id === loadingMessageId
          ? {
              id: loadingMessageId,
              type: "bot",
              text: result.answer,
              sources: result.sources,
              meta:
                result.sources.length > 0
                  ? `${result.sources.length} fuente${
                      result.sources.length === 1 ? "" : "s"
                    } encontrada${result.sources.length === 1 ? "" : "s"}`
                  : "Sin coincidencias suficientes",
            }
          : message
      )
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo realizar la búsqueda.";

    setMessages((current) =>
      current.map((item) =>
        item.id === loadingMessageId
          ? {
              id: loadingMessageId,
              type: "bot",
              text: message,
              meta: "Error en la búsqueda",
            }
          : item
      )
    );

    setTimeout(() => scrollToMessage(loadingMessageId, "start"), 120);
  } finally {
    setSearching(false);
  }
}

  function handleSelectInsurance(item: HealthInsurance) {
    if (!item.isActive) {
      const messageId = Date.now();

      setMessages((current) => [
        ...current,
        {
          id: messageId,
          type: "bot",
          text: `${item.name} está inactiva. La obra social se muestra en el listado como referencia, pero no está habilitada para consultas.`,
          meta: "Obra social inactiva",
        },
      ]);

      setTimeout(() => scrollToMessage(messageId, "start"), 80);
      return;
    }

    handleSend(`Consultar normativa de ${item.name}`);
  }

  return (
    <main className="min-h-dvh w-full overflow-x-hidden bg-[#f3f7fb] text-[#061f3d]">
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-dvh w-full max-w-full overflow-x-hidden">
        <aside
          className={[
            "sticky top-0 hidden h-dvh shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 lg:block",
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
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mb-7 px-2 text-xs text-slate-500">
              Panel de consulta
            </p>
          )}

          <nav className="space-y-1">
            {menu.map((item) => (
              <SidebarButton
                key={item.label}
                icon={item.icon}
                label={item.label}
                active={item.active}
                collapsed={collapsed}
              />
            ))}
          </nav>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <Link
              href="/logout"
              className={[
                "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-red-600 transition hover:bg-red-50",
                collapsed ? "justify-center px-0" : "",
              ].join(" ")}
              title={collapsed ? "Cerrar sesión" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Cerrar sesión</span> : null}
            </Link>
          </div>
        </aside>

        <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600"
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

        <section className="min-w-0 flex-1 overflow-x-hidden px-3 pb-3 pt-20 sm:px-4 lg:h-dvh lg:px-4 lg:py-3">
          <header className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-base font-semibold tracking-[-0.03em] text-[#061f3d]">
                  Bienvenido, {user.name}
                </h1>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {user.branchName}
                </p>
              </div>

              <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-[#12b8c8]" />
                Usuario interno
              </div>
            </div>
          </header>

          <section className="grid min-w-0 gap-3 xl:h-[calc(100dvh-105px)] xl:grid-cols-[minmax(0,1fr)_300px_300px] xl:items-start">
            <article className="flex h-[calc(100dvh-160px)] min-h-[520px] min-w-0 flex-col overflow-hidden rounded-xl border border-[#d8e7ff] bg-[#f8fbff] shadow-sm xl:h-full xl:min-h-0">
              <div className="border-b border-[#d8e7ff] bg-white px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#061f3d]">
                      Nueva consulta
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Buscá información en normativas cargadas.
                    </p>
                  </div>

                  <div className="hidden rounded-xl bg-[#edf5ff] p-2 text-[#062f73] sm:block">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden bg-[#eef6ff] px-3 py-4 sm:px-4">
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    registerMessageRef={registerMessageRef}
                  />
                ))}
              </div>

              <div className="border-t border-[#d8e7ff] bg-white p-2.5">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSend();
                  }}
                  className="flex min-w-0 gap-2"
                >
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      disabled={searching}
                      placeholder="Escribí tu consulta..."
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base text-[#061f3d] outline-none transition placeholder:text-slate-400 focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 md:h-11 md:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={searching || query.trim().length === 0}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#062f73] text-white transition hover:bg-[#05275f] disabled:cursor-not-allowed disabled:bg-slate-300 md:h-11 md:w-11"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </article>

            <aside className="grid h-[560px] min-h-0 min-w-0 gap-3 xl:block xl:h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#d7f3f6] bg-[#f7fdff] p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#061f3d]">
                      Obras sociales
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Consultadas con mayor frecuencia.
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#edf5ff] p-2 text-[#062f73]">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                </div>

                <HealthInsuranceList
                  items={healthInsurances}
                  search={insuranceSearch}
                  onSearchChange={setInsuranceSearch}
                  onSelect={handleSelectInsurance}
                />
              </article>
            </aside>

            <aside className="grid h-[560px] min-h-0 min-w-0 gap-3 xl:block xl:h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e3ddff] bg-[#fbfaff] p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#061f3d]">
                      Novedades
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Últimas actualizaciones.
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#edf5ff] p-2 text-[#062f73]">
                    <Bell className="h-4 w-4" />
                  </div>
                </div>

                <NewsList
                  items={news}
                  search={newsSearch}
                  onSearchChange={setNewsSearch}
                />
              </article>
            </aside>
          </section>

          <section className="mt-3 grid gap-3 xl:hidden">
            <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#062f73]" />
                <h3 className="text-sm font-semibold text-[#061f3d]">
                  Información
                </h3>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                Las respuestas se basarán en documentos y normativas cargadas
                por administración.
              </p>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}