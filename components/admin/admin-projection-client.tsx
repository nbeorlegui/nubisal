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

type TooltipState = {
  x: number;
  y: number;
  label: string;
  human: number;
  bot: number;
} | null;

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
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
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
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </article>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildBusinessCurve(settings: ProjectionSettings, weeklyCurve: CurvePoint[]) {
  const workingHours = weeklyCurve.filter((point) => point.humano === 1).length;
  const totalPoints = weeklyCurve.length;

  return weeklyCurve.map((point, index) => {
    const progress = totalPoints > 1 ? index / (totalPoints - 1) : 0;

    const workedUntilNow = weeklyCurve
      .slice(0, index + 1)
      .filter((item) => item.humano === 1).length;

    const humanCoverage = workingHours > 0 ? (workedUntilNow / workingHours) * 100 : 0;

    const branchPressure = clamp(settings.totalBranches / 27, 0.5, 2);
    const afterHoursPressure = clamp(settings.branches24h / 8, 0.25, 2);
    const queryPressure = clamp(settings.queriesPerBranchPerDay / 1, 0.5, 3);

    const acceleration = 0.82 + branchPressure * 0.06 + afterHoursPressure * 0.05 + queryPressure * 0.04;
    const botCoverage = Math.min(100, Math.pow(progress, 0.72) * 100 * acceleration);

    return {
      label: point.label,
      human: Math.round(humanCoverage),
      bot: Math.round(botCoverage),
      isHumanAvailable: point.humano === 1,
    };
  });
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;

    commands.push(`C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`);
  }

  return commands.join(" ");
}

function ProjectionCurve({
  settings,
  weeklyCurve,
}: {
  settings: ProjectionSettings;
  weeklyCurve: CurvePoint[];
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const curveData = useMemo(
    () => buildBusinessCurve(settings, weeklyCurve),
    [settings, weeklyCurve]
  );

  const width = 940;
  const height = 300;
  const left = 56;
  const right = 24;
  const top = 28;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const points = curveData.map((point, index) => {
    const x = left + (index / Math.max(curveData.length - 1, 1)) * plotWidth;
    const humanY = top + (1 - point.human / 100) * plotHeight;
    const botY = top + (1 - point.bot / 100) * plotHeight;

    return {
      ...point,
      x,
      humanY,
      botY,
    };
  });

  const humanPath = smoothPath(points.map((point) => ({ x: point.x, y: point.humanY })));
  const botPath = smoothPath(points.map((point) => ({ x: point.x, y: point.botY })));

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * width;
    const index = clamp(
      Math.round(((relativeX - left) / plotWidth) * (points.length - 1)),
      0,
      points.length - 1
    );

    const point = points[index];

    setTooltip({
      x: point.x,
      y: Math.min(point.humanY, point.botY),
      label: point.label,
      human: point.human,
      bot: point.bot,
    });
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="relative overflow-hidden rounded-lg bg-white">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[300px] w-full"
          onMouseMove={handleMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="botFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#062f73" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#062f73" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="humanFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((value) => {
            const y = top + (1 - value / 100) * plotHeight;

            return (
              <g key={value}>
                <line
                  x1={left}
                  y1={y}
                  x2={width - right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={value === 0 ? "0" : "5 5"}
                />
                <text x={left - 12} y={y + 4} textAnchor="end" fontSize="12" fill="#64748b">
                  {value}%
                </text>
              </g>
            );
          })}

          <line x1={left} y1={top} x2={left} y2={height - bottom} stroke="#cbd5e1" />
          <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="#cbd5e1" />

          <path d={`${humanPath} L ${width - right} ${height - bottom} L ${left} ${height - bottom} Z`} fill="url(#humanFill)" />
          <path d={`${botPath} L ${width - right} ${height - bottom} L ${left} ${height - bottom} Z`} fill="url(#botFill)" />

          <path d={humanPath} fill="none" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
          <path d={botPath} fill="none" stroke="#062f73" strokeWidth="5" strokeLinecap="round" />

          {points.map((point, index) => {
            if (index % 12 !== 0) return null;

            return (
              <text
                key={point.label}
                x={point.x}
                y={height - 15}
                fontSize="12"
                textAnchor="middle"
                fill="#94a3b8"
              >
                {point.label.split(" ")[0]}
              </text>
            );
          })}

          {tooltip ? (
            <g>
              <line
                x1={tooltip.x}
                y1={top}
                x2={tooltip.x}
                y2={height - bottom}
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />
              <circle
                cx={tooltip.x}
                cy={top + (1 - tooltip.human / 100) * plotHeight}
                r="6"
                fill="#f97316"
                stroke="#fff"
                strokeWidth="3"
              />
              <circle
                cx={tooltip.x}
                cy={top + (1 - tooltip.bot / 100) * plotHeight}
                r="6"
                fill="#062f73"
                stroke="#fff"
                strokeWidth="3"
              />
              <rect
                x={clamp(tooltip.x - 100, left, width - right - 210)}
                y={clamp(tooltip.y - 84, top, height - bottom - 96)}
                width="210"
                height="78"
                rx="12"
                fill="#ffffff"
                stroke="#dbeafe"
              />
              <text
                x={clamp(tooltip.x - 86, left + 14, width - right - 196)}
                y={clamp(tooltip.y - 58, top + 26, height - bottom - 70)}
                fontSize="12"
                fontWeight="700"
                fill="#061f3d"
              >
                {tooltip.label}
              </text>
              <text
                x={clamp(tooltip.x - 86, left + 14, width - right - 196)}
                y={clamp(tooltip.y - 36, top + 48, height - bottom - 48)}
                fontSize="12"
                fill="#f97316"
              >
                Actual: {tooltip.human}% cobertura acumulada
              </text>
              <text
                x={clamp(tooltip.x - 86, left + 14, width - right - 196)}
                y={clamp(tooltip.y - 18, top + 66, height - bottom - 30)}
                fontSize="12"
                fill="#062f73"
              >
                Con bot: {tooltip.bot}% cobertura acumulada
              </text>
            </g>
          ) : null}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-2 text-slate-600">
            <span className="h-2 w-6 rounded-full bg-[#f97316]" />
            Curva actual
          </span>
          <span className="inline-flex items-center gap-2 text-slate-600">
            <span className="h-2 w-6 rounded-full bg-[#062f73]" />
            Curva con bot
          </span>
        </div>

        <p className="text-[11px] leading-4 text-slate-500">
          La curva se recalcula automáticamente según sucursales, consultas, minutos y horario configurado.
        </p>
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
  const [hovered, setHovered] = useState<string | null>(null);
  const maxValue = Math.max(...rows.map((row) => Number(row[valueKey])), 1);

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const value = Number(row[valueKey]);
        const width = Math.max((value / maxValue) * 100, value > 0 ? 8 : 0);
        const id = `${row.name}-${valueKey}`;

        return (
          <div
            key={id}
            className="relative grid grid-cols-[120px_1fr_74px] items-center gap-2"
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
          >
            <p className="truncate text-[11px] font-bold text-slate-500">
              {row.name}
            </p>
            <div className="h-7 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#062f73] transition-all duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
            <p className="text-right text-[11px] font-black text-[#061f3d]">
              {formatDecimal(value)} {label}
            </p>

            {hovered === id ? (
              <div className="absolute right-16 top-[-34px] z-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-[#061f3d] shadow-lg">
                {row.name}: {formatDecimal(value)} {label}
              </div>
            ) : null}
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
          Comparativo entre atención manual y bot 24/7 para mostrar impacto operativo, ahorro de tiempo y cobertura ampliada.
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
          <h2 className="text-sm font-black text-[#061f3d]">Variables</h2>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
            Cambiá valores para simular escenarios. Los gráficos se actualizan automáticamente.
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
              max={settings.totalBranches}
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
              max={7}
            />

            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Desde"
                value={settings.humanStartHour}
                onChange={(value) => updateSetting("humanStartHour", value)}
                min={0}
                max={23}
              />
              <NumberInput
                label="Hasta"
                value={settings.humanEndHour}
                onChange={(value) => updateSetting("humanEndHour", value)}
                min={1}
                max={24}
              />
            </div>
          </div>
        </article>

        <ChartCard
          title="Curva actual vs curva con bot"
          subtitle="Proyección acumulada de cobertura: el esquema manual crece solo en horario administrativo; Nubisal mantiene crecimiento continuo 24/7."
          icon={Activity}
        >
          <ProjectionCurve settings={settings} weeklyCurve={projection.weeklyCurve} />
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
            <HorizontalBars rows={projection.scenarios} valueKey="horasMensuales" label="hs" />
          </div>
        </ChartCard>

        <ChartCard
          title="Disponibilidad semanal"
          subtitle="Comparación directa entre atención humana y Nubisal Bot."
          icon={Bot}
        >
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <HorizontalBars rows={projection.availabilityComparison} valueKey="horas" label="hs" />
          </div>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black text-[#061f3d]">Lectura ejecutiva</h2>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600">
          Con una red de {settings.totalBranches} sucursales, de las cuales {settings.branches24h} operan 24 horas, Nubisal permite reducir la dependencia de llamadas internas para consultas de obras sociales, vigencias, documentación, cobertura y normativas. Frente a una atención manual disponible de lunes a viernes de {settings.humanStartHour}:00 a {settings.humanEndHour}:00, el bot amplía la cobertura a 168 horas semanales, generando {projection.additionalWeeklyAvailability} horas adicionales por semana y aproximadamente {formatDecimal(projection.monthlyHoursSaved)} horas mensuales ahorradas bajo el escenario configurado.
        </p>
      </section>
    </div>
  );
}
