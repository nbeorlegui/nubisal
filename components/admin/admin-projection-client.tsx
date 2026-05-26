"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Headphones,
  Moon,
  PhoneCall,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  calculateProjection,
  defaultProjectionSettings,
  formatDecimal,
  formatNumber,
  type ProjectionSettings,
} from "@/lib/projection";

type TooltipState = {
  title: string;
  lines: string[];
} | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>

      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-[#061f3d] outline-none transition focus:border-[#062f73] focus:ring-4 focus:ring-blue-50 md:text-sm"
      />
    </label>
  );
}

function ImpactKpi({
  title,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  title: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "blue" | "green" | "orange" | "dark";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-[#062f73]",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    dark: "bg-slate-950 text-white",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-black tracking-[-0.05em] text-[#061f3d]">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>

        <div
          className={[
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
            toneClasses[tone],
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function ComparisonCard({
  title,
  subtitle,
  icon: Icon,
  items,
  variant,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  items: string[];
  variant: "manual" | "bot";
}) {
  const isBot = variant === "bot";

  return (
    <article
      className={[
        "relative overflow-hidden rounded-3xl border p-5 shadow-sm",
        isBot
          ? "border-blue-200 bg-gradient-to-br from-[#062f73] to-[#061f3d] text-white"
          : "border-orange-200 bg-gradient-to-br from-white to-orange-50 text-[#061f3d]",
      ].join(" ")}
    >
      {isBot ? (
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
      ) : null}

      <div className="relative z-10">
        <div
          className={[
            "mb-4 grid h-11 w-11 place-items-center rounded-2xl",
            isBot ? "bg-white/12 text-cyan-200" : "bg-orange-100 text-orange-700",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        <p
          className={[
            "text-[10px] font-black uppercase tracking-[0.18em]",
            isBot ? "text-cyan-200" : "text-orange-500",
          ].join(" ")}
        >
          {subtitle}
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
          {title}
        </h2>

        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-2">
              {isBot ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              )}

              <p
                className={[
                  "text-sm leading-5",
                  isBot ? "text-blue-50" : "text-slate-600",
                ].join(" ")}
              >
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function CollapsibleChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#062f73]">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-[-0.04em] text-[#061f3d]">
              {title}
            </h2>
            <p className="mt-0.5 text-sm leading-5 text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        <div
          className={[
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition",
            open ? "rotate-180 bg-slate-50" : "bg-white",
          ].join(" ")}
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      {open ? (
        <div className="border-t border-slate-100 p-5 pt-4">{children}</div>
      ) : null}
    </article>
  );
}

function buildDailyCoverage(settings: ProjectionSettings) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return days.map((day, index) => {
    const isWorkingDay = index < settings.workingDaysPerWeek;

    const manual = isWorkingDay
      ? settings.totalBranches * settings.queriesPerBranchPerDay
      : 0;

    const bot =
      settings.totalBranches * settings.queriesPerBranchPerDay +
      settings.branches24h * settings.queriesPerBranchPerDay;

    const extra = Math.max(bot - manual, 0);

    return {
      day,
      manual,
      bot,
      extra,
      isWorkingDay,
    };
  });
}

function buildMonthlyBranchProjection(settings: ProjectionSettings) {
  const normalBranches = Math.max(
    settings.totalBranches - settings.branches24h,
    0
  );

  const monthlyNormal =
    normalBranches *
    settings.queriesPerBranchPerDay *
    settings.workingDaysPerWeek *
    4.33;

  const monthly24h =
    settings.branches24h *
    settings.queriesPerBranchPerDay *
    7 *
    4.33;

  const totalMonthly = monthlyNormal + monthly24h;

  return [
    {
      name: "Sucursales horario normal",
      branches: normalBranches,
      monthlyQueries: Math.round(monthlyNormal),
      detail: `${normalBranches} sucursales × ${settings.workingDaysPerWeek} días laborales`,
    },
    {
      name: "Sucursales 24 hs",
      branches: settings.branches24h,
      monthlyQueries: Math.round(monthly24h),
      detail: `${settings.branches24h} sucursales × 7 días por semana`,
    },
    {
      name: "Total mensual proyectado",
      branches: settings.totalBranches,
      monthlyQueries: Math.round(totalMonthly),
      detail: `${settings.totalBranches} sucursales asistidas por Nubisal`,
    },
  ];
}

function CoverageChart({ settings }: { settings: ProjectionSettings }) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const data = useMemo(() => buildDailyCoverage(settings), [settings]);

  const maxValue = Math.max(...data.map((item) => item.bot), 1);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="grid gap-3">
        {data.map((item) => {
          const manualWidth = (item.manual / maxValue) * 100;
          const botWidth = (item.bot / maxValue) * 100;

          return (
            <div
              key={item.day}
              className="relative grid grid-cols-[42px_1fr] items-center gap-3"
            >
              <p className="text-xs font-black text-slate-500">{item.day}</p>

              <div className="space-y-2">
                <div
                  className="relative h-8 rounded-full bg-white"
                  onMouseEnter={() =>
                    setTooltip({
                      title: `${item.day} · Atención manual`,
                      lines: [
                        `${item.manual} consultas estimadas atendibles.`,
                        item.isWorkingDay
                          ? "Depende del horario administrativo."
                          : "Fuera de día laboral, no hay cobertura humana directa.",
                      ],
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className="flex h-full items-center rounded-full bg-orange-500 px-3 text-[11px] font-black text-white transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        manualWidth,
                        item.manual > 0 ? 8 : 0
                      )}%`,
                    }}
                  >
                    {item.manual > 0 ? item.manual : "0"}
                  </div>
                </div>

                <div
                  className="relative h-8 rounded-full bg-white"
                  onMouseEnter={() =>
                    setTooltip({
                      title: `${item.day} · Nubisal Bot`,
                      lines: [
                        `${item.bot} consultas estimadas atendibles.`,
                        `+${item.extra} consultas potenciales fuera del esquema manual.`,
                        "Disponible 24/7, sin depender de una persona.",
                      ],
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className="flex h-full items-center rounded-full bg-[#062f73] px-3 text-[11px] font-black text-white transition-all duration-300"
                    style={{
                      width: `${Math.max(botWidth, item.bot > 0 ? 8 : 0)}%`,
                    }}
                  >
                    {item.bot}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tooltip ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-black text-[#061f3d]">{tooltip.title}</p>
          <div className="mt-1 space-y-1 text-xs leading-5 text-slate-500">
            {tooltip.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
          Pasá el mouse por cada barra para ver la explicación. En mobile, tocá
          visualmente el bloque para interpretar la comparación.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-black text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded-full bg-orange-500" />
          Atención manual
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded-full bg-[#062f73]" />
          Nubisal Bot
        </span>
      </div>
    </div>
  );
}

function MonthlyBranchProjectionChart({
  settings,
}: {
  settings: ProjectionSettings;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const rows = useMemo(() => buildMonthlyBranchProjection(settings), [settings]);

  const maxValue = Math.max(...rows.map((row) => row.monthlyQueries), 1);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {rows.map((row) => {
        const width = (row.monthlyQueries / maxValue) * 100;
        const isTotal = row.name.includes("Total");

        return (
          <div
            key={row.name}
            onMouseEnter={() =>
              setTooltip({
                title: row.name,
                lines: [
                  `${formatNumber(
                    row.monthlyQueries
                  )} consultas mensuales estimadas.`,
                  `${row.branches} sucursal${
                    row.branches === 1 ? "" : "es"
                  }.`,
                  row.detail,
                ],
              })
            }
            onMouseLeave={() => setTooltip(null)}
            className="grid grid-cols-[180px_1fr_90px] items-center gap-3"
          >
            <div>
              <p className="truncate text-xs font-black text-[#061f3d]">
                {row.name}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                {row.branches} sucursal{row.branches === 1 ? "" : "es"}
              </p>
            </div>

            <div className="h-10 rounded-full bg-white">
              <div
                className={[
                  "flex h-full items-center rounded-full px-4 text-xs font-black text-white transition-all duration-300",
                  isTotal ? "bg-emerald-500" : "bg-[#062f73]",
                ].join(" ")}
                style={{ width: `${Math.max(width, 8)}%` }}
              >
                {formatNumber(row.monthlyQueries)}
              </div>
            </div>

            <p className="text-right text-xs font-black text-[#061f3d]">
              {formatNumber(row.monthlyQueries)}
            </p>
          </div>
        );
      })}

      {tooltip ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-black text-[#061f3d]">{tooltip.title}</p>
          <div className="mt-1 space-y-1 text-xs leading-5 text-slate-500">
            {tooltip.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
          Este gráfico estima cuántas consultas mensuales absorbería Nubisal
          diferenciando sucursales con horario normal y sucursales 24 hs.
        </div>
      )}
    </div>
  );
}

function WeeklyAvailabilityBar({
  humanHours,
  botHours,
}: {
  humanHours: number;
  botHours: number;
}) {
  const max = Math.max(botHours, humanHours, 1);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
          <span>Atención manual</span>
          <span>{humanHours} hs/semana</span>
        </div>

        <div className="h-10 rounded-full bg-white">
          <div
            className="flex h-full items-center rounded-full bg-orange-500 px-4 text-xs font-black text-white"
            style={{ width: `${(humanHours / max) * 100}%` }}
          >
            {humanHours} hs
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
          <span>Nubisal Bot</span>
          <span>{botHours} hs/semana</span>
        </div>

        <div className="h-10 rounded-full bg-white">
          <div
            className="flex h-full items-center rounded-full bg-[#062f73] px-4 text-xs font-black text-white"
            style={{ width: `${(botHours / max) * 100}%` }}
          >
            {botHours} hs
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioBars({
  rows,
}: {
  rows: {
    name: string;
    consultasSemanales: number;
    horasSemanales: number;
    horasMensuales: number;
  }[];
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const maxValue = Math.max(...rows.map((row) => row.horasMensuales), 1);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {rows.map((row) => {
        const width = (row.horasMensuales / maxValue) * 100;

        return (
          <div
            key={row.name}
            onMouseEnter={() =>
              setTooltip({
                title: row.name,
                lines: [
                  `${formatDecimal(
                    row.horasMensuales
                  )} horas mensuales ahorradas.`,
                  `${formatDecimal(
                    row.horasSemanales
                  )} horas semanales ahorradas.`,
                  `${row.consultasSemanales} consultas semanales estimadas.`,
                ],
              })
            }
            onMouseLeave={() => setTooltip(null)}
            className="grid grid-cols-[130px_1fr_80px] items-center gap-3"
          >
            <p className="truncate text-xs font-black text-slate-500">
              {row.name}
            </p>

            <div className="h-9 rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(width, 8)}%` }}
              />
            </div>

            <p className="text-right text-xs font-black text-[#061f3d]">
              {formatDecimal(row.horasMensuales)} hs
            </p>
          </div>
        );
      })}

      {tooltip ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-black text-[#061f3d]">{tooltip.title}</p>
          <div className="mt-1 space-y-1 text-xs leading-5 text-slate-500">
            {tooltip.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminProjectionClient() {
  const [settings, setSettings] = useState<ProjectionSettings>(
    defaultProjectionSettings
  );

  const projection = useMemo(() => calculateProjection(settings), [settings]);

  const improvementRatio =
    projection.humanWeeklyAvailability > 0
      ? projection.botWeeklyAvailability / projection.humanWeeklyAvailability
      : 0;

  const improvementPercent =
    projection.humanWeeklyAvailability > 0
      ? Math.round(
          ((projection.botWeeklyAvailability -
            projection.humanWeeklyAvailability) /
            projection.humanWeeklyAvailability) *
            100
        )
      : 0;

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
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#061f3d] p-6 text-white shadow-sm">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-32 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              Proyección comercial
            </p>

            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-[-0.06em] md:text-5xl">
              Nubisal Bot trabaja cuando la atención manual se detiene.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
              Convertí llamadas repetitivas sobre obras sociales, vigencias,
              documentación y coberturas en respuestas automáticas disponibles
              para toda la red de sucursales.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              Diferencia de cobertura
            </p>

            <p className="mt-2 text-5xl font-black tracking-[-0.07em]">
              {formatDecimal(improvementRatio)}x
            </p>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              Nubisal ofrece hasta {improvementPercent}% más disponibilidad
              semanal que el esquema manual configurado.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ImpactKpi
          title="Cobertura adicional"
          value={`+${formatNumber(
            projection.additionalWeeklyAvailability
          )} hs/sem`}
          detail="Horas semanales que antes quedaban sin atención directa."
          icon={Zap}
          tone="green"
        />

        <ImpactKpi
          title="Ahorro mensual"
          value={`${formatDecimal(projection.monthlyHoursSaved)} hs`}
          detail="Horas operativas liberadas del circuito manual."
          icon={Clock}
          tone="blue"
        />

        <ImpactKpi
          title="Sucursales asistidas"
          value={formatNumber(settings.totalBranches)}
          detail={`${settings.branches24h} sucursales con operación 24 hs.`}
          icon={Building2}
          tone="dark"
        />

        <ImpactKpi
          title="Cobertura 24 hs"
          value={`${formatNumber(projection.additional24hBranchCoverage)}`}
          detail="Horas-sucursal adicionales por semana."
          icon={Moon}
          tone="orange"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ComparisonCard
          variant="manual"
          title="Atención manual"
          subtitle="Proceso actual"
          icon={PhoneCall}
          items={[
            "Depende de una persona en horario administrativo.",
            "Interrumpe el trabajo con llamadas repetitivas.",
            "No escala bien cuando aumentan las sucursales o consultas.",
            "Fuera de horario, la respuesta puede quedar demorada.",
            "La trazabilidad depende de lo que cada persona registre.",
          ]}
        />

        <ComparisonCard
          variant="bot"
          title="Nubisal Bot"
          subtitle="Nuevo modelo operativo"
          icon={Bot}
          items={[
            "Disponible 24/7 para consultas normativas.",
            "Responde en segundos con información cargada en el sistema.",
            "Escala a todas las sucursales sin saturarse.",
            "Reduce dependencia de llamadas internas.",
            "Permite medir consultas, temas frecuentes y faltantes.",
          ]}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-[#061f3d]">
          Simulación comercial
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Ajustá los valores para mostrar distintos escenarios de impacto. Los
          gráficos están cerrados por defecto para mantener la pantalla más
          limpia.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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

          <div className="grid grid-cols-2 gap-3">
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
      </section>

      <section className="space-y-3">
        <CollapsibleChartCard
          title="Consultas atendibles: manual vs bot"
          subtitle="Comparación del volumen que puede resolver la atención manual frente al bot funcionando todo el día."
          icon={Activity}
        >
          <CoverageChart settings={settings} />
        </CollapsibleChartCard>

        <CollapsibleChartCard
          title="Consultas mensuales por tipo de sucursal"
          subtitle="Proyección mensual separando sucursales con horario normal y sucursales 24 hs."
          icon={Building2}
        >
          <MonthlyBranchProjectionChart settings={settings} />
        </CollapsibleChartCard>

        <div className="grid gap-3 xl:grid-cols-2">
          <CollapsibleChartCard
            title="Disponibilidad semanal"
            subtitle="Comparación directa entre el horario humano y la disponibilidad 24/7 del bot."
            icon={Headphones}
          >
            <WeeklyAvailabilityBar
              humanHours={projection.humanWeeklyAvailability}
              botHours={projection.botWeeklyAvailability}
            />
          </CollapsibleChartCard>

          <CollapsibleChartCard
            title="Horas ahorradas por escenario"
            subtitle="Simulación del tiempo operativo liberado según el volumen de consultas."
            icon={TrendingUp}
          >
            <ScenarioBars rows={projection.scenarios} />
          </CollapsibleChartCard>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Conclusión comercial
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[#061f3d]">
              Menos llamadas internas. Más velocidad. Más cobertura.
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              Con {settings.totalBranches} sucursales y {settings.branches24h}{" "}
              operando 24 hs, Nubisal permite absorber consultas repetitivas,
              reducir interrupciones y ampliar la disponibilidad de respuesta a
              toda la semana. Bajo este escenario, se proyectan{" "}
              <strong>
                {formatDecimal(projection.monthlyHoursSaved)} horas mensuales
                ahorradas
              </strong>{" "}
              y{" "}
              <strong>
                {formatNumber(projection.additionalWeeklyAvailability)} horas
                semanales adicionales
              </strong>{" "}
              de cobertura frente al esquema manual.
            </p>
          </div>

          <div className="rounded-3xl bg-[#061f3d] p-5 text-white xl:min-w-[260px]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              Mensaje clave
            </p>

            <p className="mt-2 text-3xl font-black tracking-[-0.06em]">
              24/7 sin saturarse
            </p>

            <p className="mt-2 text-xs leading-5 text-blue-100">
              El bot no reemplaza solo una tarea: elimina un cuello de botella.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}