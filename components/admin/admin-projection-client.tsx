"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  Bot,
  Building2,
  Clock,
  Moon,
  TrendingUp,
} from "lucide-react";
import {
  calculateProjection,
  defaultProjectionSettings,
  formatDecimal,
  formatNumber,
  type ProjectionSettings,
} from "@/lib/projection";

type CurvePoint = {
  label: string;
  humano: number;
  bot: number;
};

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>
          <p className="mt-1 break-words text-xl font-black tracking-[-0.04em] text-[#061f3d]">
            {value}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
            {detail}
          </p>
        </div>

        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#edf5ff] text-[#062f73]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-base font-semibold text-[#061f3d] outline-none focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-xs"
      />
    </label>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex min-w-0 items-start gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#062f73]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-[#061f3d]">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  );
}

function buildPolyline(points: CurvePoint[], key: "humano" | "bot") {
  const width = 900;
  const height = 210;
  const top = 22;
  const bottom = height - 26;
  const usableWidth = width - 40;
  const step = usableWidth / Math.max(points.length - 1, 1);

  return points
    .map((point, index) => {
      const x = 20 + index * step;
      const y = point[key] === 1 ? top : bottom;
      return `${x},${y}`;
    })
    .join(" ");
}

function AvailabilityCurve({ data }: { data: CurvePoint[] }) {
  const humanLine = buildPolyline(data, "humano");
  const botLine = buildPolyline(data, "bot");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3">
      <svg viewBox="0 0 900 230" className="h-[230px] w-full">
        <line x1="20" y1="22" x2="880" y2="22" stroke="#dbeafe" strokeWidth="2" />
        <line x1="20" y1="184" x2="880" y2="184" stroke="#e2e8f0" strokeWidth="2" />

        <text x="24" y="16" fontSize="14" fill="#64748b">
          Disponible
        </text>
        <text x="24" y="206" fontSize="14" fill="#64748b">
          Sin atención
        </text>

        <polyline points={humanLine} fill="none" stroke="#f97316" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={botLine} fill="none" stroke="#062f73" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((point, index) => {
          if (index % 12 !== 0) return null;
          const x = 20 + index * (860 / Math.max(data.length - 1, 1));
          return (
            <text key={point.label} x={x} y="224" fontSize="12" fill="#94a3b8" textAnchor="middle">
              {point.label.split(" ")[0]}
            </text>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold">
        <span className="inline-flex items-center gap-2 text-slate-600">
          <span className="h-2 w-5 rounded-full bg-[#f97316]" />
          Atención humana
        </span>
        <span className="inline-flex items-center gap-2 text-slate-600">
          <span className="h-2 w-5 rounded-full bg-[#062f73]" />
          Nubisal Bot
        </span>
      </div>
    </div>
  );
}

function HorizontalBars({
  rows,
  valueKey,
  label,
}: {
  rows: { name: string; [key: string]: string | number }[];
  valueKey: string;
  label: string;
}) {
  const maxValue = Math.max(...rows.map((row) => Number(row[valueKey])), 1);

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const value = Number(row[valueKey]);
        const width = Math.max((value / maxValue) * 100, value > 0 ? 8 : 0);

        return (
          <div key={`${row.name}-${valueKey}`} className="grid grid-cols-[120px_1fr_74px] items-center gap-2">
            <p className="truncate text-[11px] font-bold text-slate-500">{row.name}</p>
            <div className="h-7 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#062f73]"
                style={{ width: `${width}%` }}
              />
            </div>
            <p className="text-right text-[11px] font-black text-[#061f3d]">
              {formatDecimal(value)} {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function AdminProjectionClient() {
  const [settings, setSettings] = useState<ProjectionSettings>(
    defaultProjectionSettings
  );

  const projection = useMemo(() => calculateProjection(settings), [settings]);

  function updateSetting<Key extends keyof ProjectionSettings>(
    key: Key,
    value: ProjectionSettings[Key]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#12b8c8]">
          Impacto operativo
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-[-0.04em] text-[#061f3d]">
          Proyección Nubisal
        </h1>
        <p className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-500">
          Comparativo entre atención manual y bot 24/7 para mostrar impacto operativo y valor comercial.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Sucursales"
          value={formatNumber(settings.totalBranches)}
          detail={`${settings.branches24h} 24 hs y ${projection.normalBranches} con horario normal.`}
          icon={Building2}
        />
        <KpiCard
          title="Ahorro mensual"
          value={`${formatDecimal(projection.monthlyHoursSaved)} hs`}
          detail={`${formatDecimal(projection.weeklyHoursSaved)} hs semanales estimadas.`}
          icon={Clock}
        />
        <KpiCard
          title="Disponibilidad"
          value={`+${formatNumber(projection.additionalWeeklyAvailability)} hs`}
          detail={`Bot 168 hs/sem vs humano ${projection.humanWeeklyAvailability} hs/sem.`}
          icon={Bot}
        />
        <KpiCard
          title="Cobertura 24 hs"
          value={`${formatNumber(projection.additional24hBranchCoverage)}`}
          detail="Horas-sucursal adicionales por semana."
          icon={Moon}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="text-sm font-black text-[#061f3d]">
            Variables
          </h2>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
            Cambiá valores para simular escenarios.
          </p>

          <div className="mt-3 grid gap-2">
            <NumberInput
              label="Sucursales totales"
              value={settings.totalBranches}
              onChange={(value) => updateSetting("totalBranches", value)}
              min={1}
            />

            <NumberInput
              label="Sucursales 24 hs"
              value={settings.branches24h}
              onChange={(value) => updateSetting("branches24h", value)}
              min={0}
            />

            <NumberInput
              label="Consultas sucursal/día"
              value={settings.queriesPerBranchPerDay}
              onChange={(value) => updateSetting("queriesPerBranchPerDay", value)}
              min={1}
            />

            <NumberInput
              label="Minutos consulta manual"
              value={settings.manualMinutesPerQuery}
              onChange={(value) => updateSetting("manualMinutesPerQuery", value)}
              min={1}
            />

            <NumberInput
              label="Días laborales"
              value={settings.workingDaysPerWeek}
              onChange={(value) => updateSetting("workingDaysPerWeek", value)}
              min={1}
            />

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Desde"
                value={settings.humanStartHour}
                onChange={(value) => updateSetting("humanStartHour", value)}
                min={0}
              />
              <NumberInput
                label="Hasta"
                value={settings.humanEndHour}
                onChange={(value) => updateSetting("humanEndHour", value)}
                min={0}
              />
            </div>
          </div>
        </article>

        <ChartCard
          title="Curva actual vs curva con bot"
          subtitle="La atención humana se corta fuera del horario laboral. Nubisal permanece disponible."
          icon={Activity}
        >
          <AvailabilityCurve data={projection.weeklyCurve} />
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Horas ahorradas por escenario"
          subtitle="Comparativo según cantidad de consultas diarias por sucursal."
          icon={TrendingUp}
        >
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              Horas mensuales
            </p>
            <HorizontalBars
              rows={projection.scenarios}
              valueKey="horasMensuales"
              label="hs"
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Disponibilidad semanal"
          subtitle="Comparación directa entre atención humana y Nubisal Bot."
          icon={Bot}
        >
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <HorizontalBars
              rows={projection.availabilityComparison}
              valueKey="horas"
              label="hs"
            />
          </div>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black text-[#061f3d]">Lectura ejecutiva</h2>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600">
          Con una red de {settings.totalBranches} sucursales, de las cuales{" "}
          {settings.branches24h} operan 24 horas, Nubisal permite reducir la
          dependencia de llamadas internas para consultas de obras sociales,
          vigencias, documentación, cobertura y normativas. Frente a una
          atención manual disponible de lunes a viernes de{" "}
          {settings.humanStartHour}:00 a {settings.humanEndHour}:00, el bot
          amplía la cobertura a 168 horas semanales, generando{" "}
          {projection.additionalWeeklyAvailability} horas adicionales por semana
          y aproximadamente {formatDecimal(projection.monthlyHoursSaved)} horas
          mensuales ahorradas bajo el escenario configurado.
        </p>
      </section>
    </div>
  );
}
