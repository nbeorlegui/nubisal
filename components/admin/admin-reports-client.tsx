"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";
import type { ChartDatum, ReportsData } from "@/lib/reports";

const PAGE_SIZE = 10;

function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tracking-[-0.04em] text-[#061f3d]">
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
        {detail}
      </p>
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-start gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#062f73]">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-[#061f3d]">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </article>
  );
}

function EmptyState() {
  return (
    <div className="grid h-[180px] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400">
      Sin datos suficientes todavía.
    </div>
  );
}

function SimpleBarChart({ data }: { data: ChartDatum[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const width = Math.max(
          (item.value / maxValue) * 100,
          item.value > 0 ? 8 : 0
        );

        return (
          <div
            key={item.name}
            className="grid grid-cols-[105px_1fr_36px] items-center gap-2"
          >
            <p
              className="truncate text-[11px] font-semibold text-slate-500"
              title={item.name}
            >
              {item.name}
            </p>
            <div className="h-7 overflow-hidden rounded-full bg-slate-100">
              <div
                className="flex h-full items-center rounded-full bg-[#062f73] px-2 text-[10px] font-black text-white"
                style={{ width: `${width}%` }}
              >
                {item.value > 0 ? item.value : ""}
              </div>
            </div>
            <p className="text-right text-[11px] font-black text-[#061f3d]">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DailyColumns({ data }: { data: ChartDatum[] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) return <EmptyState />;

  return (
    <div className="flex h-[190px] items-end gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 pb-3 pt-5">
      {data.map((item) => {
        const height = Math.max(
          (item.value / maxValue) * 140,
          item.value > 0 ? 12 : 2
        );

        return (
          <div
            key={item.name}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-[145px] w-full items-end justify-center">
              <div
                className="w-full max-w-[22px] rounded-t-lg bg-[#062f73]"
                style={{ height }}
                title={`${item.name}: ${item.value}`}
              />
            </div>
            <p className="w-full truncate text-center text-[9px] font-semibold text-slate-400">
              {item.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ResponseSummary({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const withResponse =
    data.find((item) => item.name.toLowerCase().includes("con"))?.value ?? 0;
  const withoutResponse = Math.max(total - withResponse, 0);
  const percentage = total > 0 ? Math.round((withResponse / total) * 100) : 0;

  if (total === 0) return <EmptyState />;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Resueltas
          </p>
          <p className="mt-1 text-3xl font-black text-[#061f3d]">
            {percentage}%
          </p>
        </div>
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      </div>

      <div className="mt-4 h-4 overflow-hidden rounded-full bg-red-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white p-2">
          <p className="font-black text-emerald-600">{withResponse}</p>
          <p className="text-slate-500">Con respuesta</p>
        </div>
        <div className="rounded-lg bg-white p-2">
          <p className="font-black text-red-500">{withoutResponse}</p>
          <p className="text-slate-500">Sin respuesta</p>
        </div>
      </div>
    </div>
  );
}

export function AdminReportsClient({
  data,
  initialStartDate,
  initialEndDate,
}: {
  data: ReportsData;
  initialStartDate: string;
  initialEndDate: string;
}) {
  const [page, setPage] = useState(1);

  const compactKpis = data.kpis.slice(0, 4);
  const totalPages = Math.max(Math.ceil(data.latestQueries.length / PAGE_SIZE), 1);

  const queryString = new URLSearchParams({
    startDate: initialStartDate,
    endDate: initialEndDate,
  }).toString();

  const paginatedQueries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return data.latestQueries.slice(start, start + PAGE_SIZE);
  }, [data.latestQueries, page]);

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#12b8c8]">
              Administración
            </p>
            <h1 className="mt-0.5 text-xl font-black tracking-[-0.04em] text-[#061f3d]">
              Reportes
            </h1>
            <p className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-500">
              Indicadores reales del bot: consultas, respuestas, sucursales, obras sociales y normativas.
            </p>
          </div>

          <div className="flex flex-col gap-2 xl:items-end">
            <form method="GET" className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Desde
                </span>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={initialStartDate}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#061f3d] outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Hasta
                </span>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={initialEndDate}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#061f3d] outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#062f73] px-3 text-xs font-black text-white hover:bg-[#05275f]"
              >
                <CalendarDays className="h-4 w-4" />
                Filtrar
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <a
                href={`/admin/reportes/export-excel?${queryString}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-[#062f73] hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Excel
              </a>
              <a
                href={`/admin/reportes/export-pdf?${queryString}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#062f73] px-3 text-xs font-black text-white hover:bg-[#05275f]"
              >
                <FileText className="h-4 w-4" /> PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {compactKpis.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <ChartCard title="Consultas por día" subtitle="Según el rango seleccionado">
          <DailyColumns data={data.queriesByDay} />
        </ChartCard>

        <ChartCard title="Consultas con respuesta" subtitle="Nivel de resolución del bot">
          <ResponseSummary data={data.responseStatus} />
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Consultas por sucursal" subtitle="Ranking de sucursales que más consultan">
          <SimpleBarChart data={data.queriesByBranch} />
        </ChartCard>

        <ChartCard title="Obras sociales más consultadas" subtitle="Ranking por consultas detectadas">
          <SimpleBarChart data={data.queriesByHealthInsurance} />
        </ChartCard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-black text-[#061f3d]">Últimas consultas</h2>
            <p className="text-[11px] text-slate-500">
              Se muestran 10 por página. Total: {data.latestQueries.length}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="h-8 rounded-lg border border-slate-200 px-3 font-bold text-slate-600 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="font-bold text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="h-8 rounded-lg border border-slate-200 px-3 font-bold text-slate-600 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 uppercase tracking-[0.12em] text-slate-400">
                <th className="py-2 pr-3">Consulta</th>
                <th className="py-2 pr-3">Usuario</th>
                <th className="py-2 pr-3">Sucursal</th>
                <th className="py-2 pr-3">Obra social</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQueries.map((query) => (
                <tr key={query.id} className="border-b border-slate-100 text-slate-600">
                  <td className="max-w-[300px] py-2.5 pr-3 font-bold text-[#061f3d]">
                    {query.text}
                  </td>
                  <td className="py-2.5 pr-3">{query.userName}</td>
                  <td className="py-2.5 pr-3">{query.branchName}</td>
                  <td className="py-2.5 pr-3">{query.healthInsuranceName}</td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-[10px] font-black",
                        query.resultFound
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600",
                      ].join(" ")}
                    >
                      {query.resultFound ? "Con respuesta" : "Sin respuesta"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">{query.createdAt}</td>
                </tr>
              ))}

              {paginatedQueries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Todavía no hay consultas registradas para el rango seleccionado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
