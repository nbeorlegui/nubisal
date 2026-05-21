"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Bot, Building2, Clock, Moon, TrendingUp } from "lucide-react";
import {
  calculateProjection,
  defaultProjectionSettings,
  formatDecimal,
  formatNumber,
  type ProjectionSettings,
} from "@/lib/projection";

function KpiCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
          <p className="mt-2 break-words text-2xl font-black tracking-[-0.04em] text-[#061f3d]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#edf5ff] text-[#062f73]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function NumberInput({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (value: number) => void; min?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-semibold text-[#061f3d] outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
      />
    </label>
  );
}

export function AdminProjectionClient() {
  const [settings, setSettings] = useState<ProjectionSettings>(defaultProjectionSettings);
  const projection = useMemo(() => calculateProjection(settings), [settings]);

  function updateSetting<Key extends keyof ProjectionSettings>(key: Key, value: ProjectionSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#12b8c8]">Impacto operativo</p>
        <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#061f3d]">Proyección Nubisal</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Comparativo entre el esquema actual de atención manual y la cobertura del bot de consultas normativas funcionando 24/7.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Sucursales" value={formatNumber(settings.totalBranches)} detail={`${settings.branches24h} sucursales 24 hs y ${projection.normalBranches} con horario normal.`} icon={Building2} />
        <KpiCard title="Horas ahorradas" value={`${formatDecimal(projection.monthlyHoursSaved)} hs/mes`} detail={`${formatDecimal(projection.weeklyHoursSaved)} horas semanales estimadas.`} icon={Clock} />
        <KpiCard title="Disponibilidad" value={`+${formatNumber(projection.additionalWeeklyAvailability)} hs/sem`} detail={`Bot 168 hs/semana vs atención humana ${projection.humanWeeklyAvailability} hs/semana.`} icon={Bot} />
        <KpiCard title="Cobertura 24 hs" value={`${formatNumber(projection.additional24hBranchCoverage)} hs-sucursal`} detail="Cobertura adicional semanal para sucursales 24 hs." icon={Moon} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-[#061f3d]">Variables de simulación</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">Ajustá los valores para ver diferentes escenarios de ahorro y cobertura.</p>
          <div className="mt-4 grid gap-3">
            <NumberInput label="Sucursales totales" value={settings.totalBranches} onChange={(value) => updateSetting("totalBranches", value)} min={1} />
            <NumberInput label="Sucursales 24 hs" value={settings.branches24h} onChange={(value) => updateSetting("branches24h", value)} min={0} />
            <NumberInput label="Consultas por sucursal/día" value={settings.queriesPerBranchPerDay} onChange={(value) => updateSetting("queriesPerBranchPerDay", value)} min={1} />
            <NumberInput label="Minutos por consulta manual" value={settings.manualMinutesPerQuery} onChange={(value) => updateSetting("manualMinutesPerQuery", value)} min={1} />
            <NumberInput label="Días laborales/semana" value={settings.workingDaysPerWeek} onChange={(value) => updateSetting("workingDaysPerWeek", value)} min={1} />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="Desde" value={settings.humanStartHour} onChange={(value) => updateSetting("humanStartHour", value)} min={0} />
              <NumberInput label="Hasta" value={settings.humanEndHour} onChange={(value) => updateSetting("humanEndHour", value)} min={0} />
            </div>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 shrink-0 text-[#062f73]" />
            <div>
              <h2 className="text-base font-black text-[#061f3d]">Curva actual vs curva con bot</h2>
              <p className="text-sm text-slate-500">La atención humana solo cubre horario laboral. Nubisal mantiene disponibilidad permanente.</p>
            </div>
          </div>
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection.weeklyCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => (Number(value) === 1 ? "Disponible" : "")} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => {
                    const numericValue = Number(value);
                    return [
                      numericValue === 1 ? "Disponible" : "Sin atención",
                      name === "humano" ? "Atención humana" : "Nubisal Bot",
                    ];
                  }}
                />
                <Line type="monotone" dataKey="humano" name="Atención humana" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="bot" name="Nubisal Bot" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#062f73]" />
            <div>
              <h2 className="text-base font-black text-[#061f3d]">Horas ahorradas por escenario</h2>
              <p className="text-sm text-slate-500">Comparativo según cantidad de consultas diarias por sucursal.</p>
            </div>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projection.scenarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="horasSemanales" name="Horas semanales" />
                <Bar dataKey="horasMensuales" name="Horas mensuales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#062f73]" />
            <div>
              <h2 className="text-base font-black text-[#061f3d]">Disponibilidad semanal</h2>
              <p className="text-sm text-slate-500">Comparación entre atención humana y Nubisal Bot.</p>
            </div>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projection.availabilityComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="horas" name="Horas por semana" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-[#061f3d]">Lectura ejecutiva</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          Con una red de {settings.totalBranches} sucursales, de las cuales {settings.branches24h} operan 24 horas, Nubisal permite reducir la dependencia de llamadas internas para consultas de obras sociales, vigencias, documentación, cobertura y normativas. Frente a una atención manual disponible de lunes a viernes de {settings.humanStartHour}:00 a {settings.humanEndHour}:00, el bot amplía la cobertura a 168 horas semanales, generando {projection.additionalWeeklyAvailability} horas adicionales por semana y aproximadamente {formatDecimal(projection.monthlyHoursSaved)} horas mensuales ahorradas bajo el escenario configurado.
        </p>
      </section>
    </div>
  );
}
