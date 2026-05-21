"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Download, FileText, SearchCheck } from "lucide-react";
import type { ReportsData } from "@/lib/reports";

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#061f3d]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function EmptyChart() {
  return <div className="grid h-full place-items-center text-sm text-slate-400">Sin datos suficientes todavía.</div>;
}

export function AdminReportsClient({ data }: { data: ReportsData }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#12b8c8]">Administración</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#061f3d]">Reportes</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Indicadores reales del uso del bot, consultas, sucursales, obras sociales y normativas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/admin/reportes/export-excel" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#062f73] hover:bg-slate-50">
              <Download className="h-4 w-4" /> Excel
            </a>
            <a href="/admin/reportes/export-pdf" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#062f73] px-4 text-sm font-bold text-white hover:bg-[#05275f]">
              <FileText className="h-4 w-4" /> PDF
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((item) => <KpiCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#062f73]" />
            <h2 className="text-base font-black text-[#061f3d]">Consultas por día</h2>
          </div>
          <div className="h-[300px] w-full min-w-0">
            {data.queriesByDay.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.queriesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Consultas" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <SearchCheck className="h-5 w-5 text-[#062f73]" />
            <h2 className="text-base font-black text-[#061f3d]">Consultas con respuesta</h2>
          </div>
          <div className="h-[300px] w-full min-w-0">
            {data.responseStatus.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={data.responseStatus} dataKey="value" nameKey="name" outerRadius={100} label />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-base font-black text-[#061f3d]">Consultas por sucursal</h2>
          <div className="h-[300px] w-full min-w-0">
            {data.queriesByBranch.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.queriesByBranch}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Consultas" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-base font-black text-[#061f3d]">Obras sociales más consultadas</h2>
          <div className="h-[300px] w-full min-w-0">
            {data.queriesByHealthInsurance.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.queriesByHealthInsurance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Consultas" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-base font-black text-[#061f3d]">Últimas consultas</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.12em] text-slate-400">
                <th className="py-2 pr-3">Consulta</th>
                <th className="py-2 pr-3">Usuario</th>
                <th className="py-2 pr-3">Sucursal</th>
                <th className="py-2 pr-3">Obra social</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.latestQueries.map((query) => (
                <tr key={query.id} className="border-b border-slate-100 text-slate-600">
                  <td className="max-w-[280px] py-3 pr-3 font-semibold text-[#061f3d]">{query.text}</td>
                  <td className="py-3 pr-3">{query.userName}</td>
                  <td className="py-3 pr-3">{query.branchName}</td>
                  <td className="py-3 pr-3">{query.healthInsuranceName}</td>
                  <td className="py-3 pr-3">{query.resultFound ? "Con respuesta" : "Sin respuesta"}</td>
                  <td className="py-3 pr-3">{query.createdAt}</td>
                </tr>
              ))}
              {data.latestQueries.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Todavía no hay consultas registradas.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
