"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Headphones,
  PhoneCall,
  Settings2,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  calculateProjection,
  defaultProjectionSettings,
  formatDecimal,
  formatNumber,
  type ProjectionSettings,
} from "@/lib/projection";

type ModalKey =
  | "overview"
  | "economics"
  | "coverage"
  | "monthly"
  | "availability"
  | "settings"
  | null;

type TooltipState = {
  title: string;
  lines: string[];
} | null;

type UsageSettings = {
  peoplePerBranch: number;
  queriesPerPersonPerDay: number;
  operatingDaysPerMonth: number;
};

type FinanceSettings = {
  adminGrossSalary: number;
  employerChargesPercent: number;
  botMonthlyCost: number;
};

type ProjectionResult = ReturnType<typeof calculateProjection>;

const DEFAULT_USAGE: UsageSettings = {
  peoplePerBranch: 5,
  queriesPerPersonPerDay: 1,
  operatingDaysPerMonth: 26,
};

const DEFAULT_FINANCE: FinanceSettings = {
  adminGrossSalary: 1200000,
  employerChargesPercent: 30,
  botMonthlyCost: 825000,
};

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function getOperationalMetrics({
  settings,
  usage,
  finance,
  projection,
}: {
  settings: ProjectionSettings;
  usage: UsageSettings;
  finance: FinanceSettings;
  projection: ProjectionResult;
}) {
  const assistedUsers = settings.totalBranches * usage.peoplePerBranch;

  const monthlyQueries =
    assistedUsers *
    usage.queriesPerPersonPerDay *
    usage.operatingDaysPerMonth;

  const monthlyHoursReleased =
    (monthlyQueries * settings.manualMinutesPerQuery) / 60;

  const monthlyHumanCost =
    finance.adminGrossSalary * (1 + finance.employerChargesPercent / 100);

  const humanAvailableHoursMonth = Math.max(
    projection.humanWeeklyAvailability * 4.33,
    1
  );

  const botAvailableHoursMonth = 24 * 30;

  const humanCostPerAvailableHour =
    monthlyHumanCost / humanAvailableHoursMonth;

  const botCostPerAvailableHour = finance.botMonthlyCost / botAvailableHoursMonth;

  const valueReleased = monthlyHoursReleased * humanCostPerAvailableHour;

  const costPerQuery =
    monthlyQueries > 0 ? finance.botMonthlyCost / monthlyQueries : 0;

  const valuePerQuery =
    settings.manualMinutesPerQuery > 0
      ? (settings.manualMinutesPerQuery / 60) * humanCostPerAvailableHour
      : 0;

  const breakEvenQueries =
    valuePerQuery > 0 ? finance.botMonthlyCost / valuePerQuery : 0;

  const netMonthlyImpact = valueReleased - finance.botMonthlyCost;
  const netAnnualImpact = netMonthlyImpact * 12;

  const directCostDifference = monthlyHumanCost - finance.botMonthlyCost;

  const improvementRatio =
    projection.humanWeeklyAvailability > 0
      ? projection.botWeeklyAvailability / projection.humanWeeklyAvailability
      : 0;

  const projectedQueryCoverage =
    breakEvenQueries > 0 ? (monthlyQueries / breakEvenQueries) * 100 : 0;

  return {
    assistedUsers,
    monthlyQueries,
    monthlyHoursReleased,
    monthlyHumanCost,
    humanAvailableHoursMonth,
    botAvailableHoursMonth,
    humanCostPerAvailableHour,
    botCostPerAvailableHour,
    valueReleased,
    costPerQuery,
    valuePerQuery,
    breakEvenQueries,
    netMonthlyImpact,
    netAnnualImpact,
    directCostDifference,
    improvementRatio,
    projectedQueryCoverage,
  };
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>

      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            {prefix}
          </span>
        ) : null}

        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={[
            "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#061f3d] outline-none transition focus:border-[#062f73] focus:ring-4 focus:ring-blue-50",
            prefix ? "pl-7" : "",
          ].join(" ")}
        />
      </div>
    </label>
  );
}

function HeroMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/10 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-[-0.06em] text-white">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-4 text-blue-100">{detail}</p>
    </article>
  );
}

function MiniMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "blue" | "cyan" | "green" | "dark";
}) {
  const styles = {
    blue: "bg-blue-50 text-[#062f73]",
    cyan: "bg-cyan-50 text-cyan-700",
    green: "bg-emerald-50 text-emerald-700",
    dark: "bg-slate-100 text-slate-800",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-black tracking-[-0.05em] text-[#061f3d]">
            {value}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">
            {detail}
          </p>
        </div>

        <div
          className={[
            "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
            styles[tone],
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  );
}

function CompactComparison({
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
        "rounded-2xl border p-4 shadow-sm",
        isBot
          ? "border-blue-200 bg-[#062f73] text-white"
          : "border-slate-200 bg-white text-[#061f3d]",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={[
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            isBot ? "bg-white/10 text-cyan-200" : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p
            className={[
              "text-[9px] font-black uppercase tracking-[0.16em]",
              isBot ? "text-cyan-200" : "text-slate-400",
            ].join(" ")}
          >
            {subtitle}
          </p>
          <h2 className="truncate text-lg font-black tracking-[-0.04em]">
            {title}
          </h2>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            {isBot ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200" />
            ) : (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
            )}

            <p
              className={[
                "text-xs leading-5",
                isBot ? "text-blue-50" : "text-slate-600",
              ].join(" ")}
            >
              {item}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActionCard({
  title,
  subtitle,
  icon: Icon,
  onClick,
  highlight,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex min-h-[78px] w-full items-center justify-between gap-3 rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        highlight
          ? "border-[#12b8c8]/40 bg-gradient-to-br from-cyan-50 to-white"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={[
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            highlight ? "bg-cyan-100 text-cyan-700" : "bg-blue-50 text-[#062f73]",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-black tracking-[-0.03em] text-[#061f3d]">
            {title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#062f73]" />
    </button>
  );
}

function TooltipBox({ tooltip }: { tooltip: Exclude<TooltipState, null> }) {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <p className="text-xs font-black text-[#061f3d]">{tooltip.title}</p>
      <div className="mt-1 space-y-0.5 text-[11px] leading-4 text-slate-500">
        {tooltip.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function CompactBar({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-black text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="h-7 rounded-full bg-white">
        <div
          className={[
            "flex h-full items-center rounded-full px-3 text-[10px] font-black text-white",
            color,
          ].join(" ")}
          style={{ width: `${Math.min(Math.max(width, 8), 100)}%` }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function buildDailyCoverage({
  settings,
  usage,
}: {
  settings: ProjectionSettings;
  usage: UsageSettings;
}) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const totalUsers = settings.totalBranches * usage.peoplePerBranch;
  const users24h = settings.branches24h * usage.peoplePerBranch;

  return days.map((day, index) => {
    const isWorkingDay = index < settings.workingDaysPerWeek;

    const manual = isWorkingDay
      ? totalUsers * usage.queriesPerPersonPerDay
      : 0;

    const bot =
      totalUsers * usage.queriesPerPersonPerDay +
      users24h * usage.queriesPerPersonPerDay;

    const extra = Math.max(bot - manual, 0);

    return { day, manual, bot, extra, isWorkingDay };
  });
}

function buildMonthlyBranchProjection({
  settings,
  usage,
}: {
  settings: ProjectionSettings;
  usage: UsageSettings;
}) {
  const normalBranches = Math.max(
    settings.totalBranches - settings.branches24h,
    0
  );

  const normalUsers = normalBranches * usage.peoplePerBranch;
  const users24h = settings.branches24h * usage.peoplePerBranch;

  const monthlyNormal =
    normalUsers *
    usage.queriesPerPersonPerDay *
    settings.workingDaysPerWeek *
    4.33;

  const monthly24h =
    users24h *
    usage.queriesPerPersonPerDay *
    7 *
    4.33;

  const totalMonthly = monthlyNormal + monthly24h;

  return [
    {
      name: "Horario normal",
      users: normalUsers,
      monthlyQueries: Math.round(monthlyNormal),
      detail: `${normalUsers} usuarios × ${settings.workingDaysPerWeek} días laborales`,
      color: "bg-[#062f73]",
    },
    {
      name: "Sucursales 24 hs",
      users: users24h,
      monthlyQueries: Math.round(monthly24h),
      detail: `${users24h} usuarios × 7 días por semana`,
      color: "bg-[#12b8c8]",
    },
    {
      name: "Total mensual",
      users: normalUsers + users24h,
      monthlyQueries: Math.round(totalMonthly),
      detail: `${normalUsers + users24h} usuarios asistidos por Nubisal`,
      color: "bg-emerald-500",
    },
  ];
}

function HybridOverview({
  settings,
  usage,
  finance,
  projection,
}: {
  settings: ProjectionSettings;
  usage: UsageSettings;
  finance: FinanceSettings;
  projection: ProjectionResult;
}) {
  const metrics = getOperationalMetrics({ settings, usage, finance, projection });

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <h3 className="text-sm font-black text-[#061f3d]">
          Red asistida por el bot
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          El valor real no es una persona usando el bot: es toda la red operativa
          consultando recetas, normativas y obras sociales.
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Usuarios asistidos
            </p>
            <p className="mt-1 text-lg font-black text-[#061f3d]">
              {formatNumber(metrics.assistedUsers)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Consultas mensuales
            </p>
            <p className="mt-1 text-lg font-black text-[#061f3d]">
              {formatNumber(metrics.monthlyQueries)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Horas liberadas
            </p>
            <p className="mt-1 text-lg font-black text-[#061f3d]">
              {formatDecimal(metrics.monthlyHoursReleased)} hs/mes
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Costo por consulta
            </p>
            <p className="mt-1 text-lg font-black text-[#062f73]">
              {money(metrics.costPerQuery)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <h3 className="text-sm font-black text-[#061f3d]">
          Punto de equilibrio
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Muestra si el volumen estimado de consultas alcanza para justificar el
          costo mensual del bot por valor operativo recuperado.
        </p>

        <div className="mt-3 space-y-3">
          <CompactBar
            label="Consultas proyectadas"
            value={formatNumber(metrics.monthlyQueries)}
            width={metrics.projectedQueryCoverage}
            color="bg-emerald-500"
          />
          <CompactBar
            label="Punto de equilibrio"
            value={formatNumber(metrics.breakEvenQueries)}
            width={100}
            color="bg-[#062f73]"
          />
        </div>

        <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
          {metrics.monthlyQueries >= metrics.breakEvenQueries ? (
            <>
              <strong className="text-emerald-700">Escenario favorable:</strong>{" "}
              la proyección supera el punto de equilibrio económico directo y
              además suma cobertura 24/7.
            </>
          ) : (
            <>
              <strong className="text-[#061f3d]">Escenario en evaluación:</strong>{" "}
              la proyección todavía no supera el punto de equilibrio directo,
              pero puede justificarse por cobertura, trazabilidad y reducción de
              interrupciones.
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EconomicsDetail({
  settings,
  usage,
  finance,
  projection,
}: {
  settings: ProjectionSettings;
  usage: UsageSettings;
  finance: FinanceSettings;
  projection: ProjectionResult;
}) {
  const metrics = getOperationalMetrics({ settings, usage, finance, projection });

  return (
    <div className="space-y-3">
      <HybridOverview
        settings={settings}
        usage={usage}
        finance={finance}
        projection={projection}
      />

      <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <h3 className="text-sm font-black text-[#061f3d]">
          Lectura económica
        </h3>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Valor liberado mensual
            </p>
            <p className="mt-1 text-lg font-black text-emerald-600">
              {money(metrics.valueReleased)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Costo mensual bot
            </p>
            <p className="mt-1 text-lg font-black text-[#062f73]">
              {money(finance.botMonthlyCost)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Neto mensual
            </p>
            <p
              className={[
                "mt-1 text-lg font-black",
                metrics.netMonthlyImpact >= 0
                  ? "text-emerald-600"
                  : "text-red-600",
              ].join(" ")}
            >
              {money(metrics.netMonthlyImpact)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Neto anual
            </p>
            <p
              className={[
                "mt-1 text-lg font-black",
                metrics.netAnnualImpact >= 0
                  ? "text-emerald-600"
                  : "text-red-600",
              ].join(" ")}
            >
              {money(metrics.netAnnualImpact)}
            </p>
          </div>
        </div>

        <p className="mt-3 rounded-xl border border-blue-100 bg-white p-3 text-xs leading-5 text-slate-600">
          <strong className="text-[#061f3d]">Criterio:</strong> el valor
          liberado surge de multiplicar las consultas mensuales proyectadas por
          los minutos promedio que demandaría resolverlas manualmente. No se
          presenta como ingreso directo, sino como tiempo operativo recuperado y
          capacidad adicional para la red.
        </p>
      </section>
    </div>
  );
}

function CoverageChart({
  settings,
  usage,
}: {
  settings: ProjectionSettings;
  usage: UsageSettings;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const data = useMemo(
    () => buildDailyCoverage({ settings, usage }),
    [settings, usage]
  );
  const maxValue = Math.max(...data.map((item) => item.bot), 1);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="grid gap-2">
        {data.map((item) => {
          const manualWidth = (item.manual / maxValue) * 100;
          const botWidth = (item.bot / maxValue) * 100;

          return (
            <div
              key={item.day}
              className="grid grid-cols-[34px_1fr] items-center gap-2"
            >
              <p className="text-[11px] font-black text-slate-500">{item.day}</p>

              <div className="grid gap-1.5">
                <div
                  className="h-6 rounded-full bg-white"
                  onMouseEnter={() =>
                    setTooltip({
                      title: `${item.day} · Atención manual`,
                      lines: [
                        `${formatNumber(item.manual)} consultas atendibles.`,
                        item.isWorkingDay
                          ? "Cubre solo horario administrativo."
                          : "Sin cobertura humana directa.",
                      ],
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className="flex h-full items-center rounded-full bg-slate-500 px-2 text-[10px] font-black text-white transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        manualWidth,
                        item.manual > 0 ? 8 : 0
                      )}%`,
                    }}
                  >
                    {item.manual > 0 ? formatNumber(item.manual) : "0"}
                  </div>
                </div>

                <div
                  className="h-6 rounded-full bg-white"
                  onMouseEnter={() =>
                    setTooltip({
                      title: `${item.day} · Nubisal Bot`,
                      lines: [
                        `${formatNumber(item.bot)} consultas atendibles.`,
                        `+${formatNumber(item.extra)} sobre el esquema manual.`,
                        "Disponible 24/7.",
                      ],
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className="flex h-full items-center rounded-full bg-[#062f73] px-2 text-[10px] font-black text-white transition-all duration-300"
                    style={{
                      width: `${Math.max(botWidth, item.bot > 0 ? 8 : 0)}%`,
                    }}
                  >
                    {formatNumber(item.bot)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tooltip ? (
        <TooltipBox tooltip={tooltip} />
      ) : (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 text-[11px] leading-4 text-slate-500">
          Gris: esquema manual. Azul: Nubisal Bot.
        </div>
      )}
    </div>
  );
}

function MonthlyBranchProjectionChart({
  settings,
  usage,
}: {
  settings: ProjectionSettings;
  usage: UsageSettings;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const rows = useMemo(
    () => buildMonthlyBranchProjection({ settings, usage }),
    [settings, usage]
  );
  const maxValue = Math.max(...rows.map((row) => row.monthlyQueries), 1);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="space-y-2">
        {rows.map((row) => {
          const width = (row.monthlyQueries / maxValue) * 100;

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
                    `${formatNumber(row.users)} usuarios.`,
                    row.detail,
                  ],
                })
              }
              onMouseLeave={() => setTooltip(null)}
              className="grid grid-cols-[120px_1fr_82px] items-center gap-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black text-[#061f3d]">
                  {row.name}
                </p>
                <p className="text-[9px] font-semibold text-slate-400">
                  {formatNumber(row.users)} usuarios
                </p>
              </div>

              <div className="h-7 rounded-full bg-white">
                <div
                  className={[
                    "flex h-full items-center rounded-full px-2 text-[10px] font-black text-white transition-all duration-300",
                    row.color,
                  ].join(" ")}
                  style={{ width: `${Math.max(width, 8)}%` }}
                >
                  {formatNumber(row.monthlyQueries)}
                </div>
              </div>

              <p className="text-right text-[11px] font-black text-[#061f3d]">
                {formatNumber(row.monthlyQueries)}
              </p>
            </div>
          );
        })}
      </div>

      {tooltip ? <TooltipBox tooltip={tooltip} /> : null}
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
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <CompactBar
        label="Atención manual"
        value={`${humanHours} hs/semana`}
        width={(humanHours / max) * 100}
        color="bg-slate-500"
      />
      <CompactBar
        label="Nubisal Bot"
        value={`${botHours} hs/semana`}
        width={(botHours / max) * 100}
        color="bg-[#062f73]"
      />
    </div>
  );
}

function ChartModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
        <section className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-4">
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-[-0.04em] text-[#061f3d]">
                {title}
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </section>
      </div>
    </div>
  );
}

export function AdminProjectionClient() {
  const [settings, setSettings] = useState<ProjectionSettings>(
    defaultProjectionSettings
  );

  const [usage, setUsage] = useState<UsageSettings>(DEFAULT_USAGE);
  const [finance, setFinance] = useState<FinanceSettings>(DEFAULT_FINANCE);
  const [modal, setModal] = useState<ModalKey>(null);

  const projection = useMemo(() => calculateProjection(settings), [settings]);

  const metrics = useMemo(
    () => getOperationalMetrics({ settings, usage, finance, projection }),
    [settings, usage, finance, projection]
  );

  function updateSetting<Key extends keyof ProjectionSettings>(
    key: Key,
    value: ProjectionSettings[Key]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateUsage<Key extends keyof UsageSettings>(
    key: Key,
    value: UsageSettings[Key]
  ) {
    setUsage((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateFinance<Key extends keyof FinanceSettings>(
    key: Key,
    value: FinanceSettings[Key]
  ) {
    setFinance((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-[#061f3d] p-4 text-white shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_540px] xl:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
              Proyección comercial
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.05em]">
              Nubisal Bot asiste a toda la red operativa
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-blue-100">
              No es una persona usando el sistema: son usuarios en cada sucursal
              consultando recetas, normativas, coberturas y obras sociales.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <HeroMetric
              label="Usuarios asistidos"
              value={formatNumber(metrics.assistedUsers)}
              detail={`${settings.totalBranches} sucursales × ${usage.peoplePerBranch} personas`}
            />
            <HeroMetric
              label="Consultas mensuales"
              value={formatNumber(metrics.monthlyQueries)}
              detail={`${usage.queriesPerPersonPerDay} consulta/persona/día`}
            />
            <HeroMetric
              label="Costo por consulta"
              value={money(metrics.costPerQuery)}
              detail={`Bot mensual ${money(finance.botMonthlyCost)}`}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniMetric
          label="Horas liberadas"
          value={`${formatDecimal(metrics.monthlyHoursReleased)} hs`}
          detail="Tiempo operativo recuperado por mes."
          icon={Clock}
          tone="blue"
        />
        <MiniMetric
          label="Valor operativo"
          value={money(metrics.valueReleased)}
          detail="Equivalente económico de horas liberadas."
          icon={TrendingUp}
          tone="green"
        />
        <MiniMetric
          label="Punto equilibrio"
          value={formatNumber(metrics.breakEvenQueries)}
          detail="Consultas/mes para cubrir el costo directo."
          icon={Activity}
          tone="cyan"
        />
        <MiniMetric
          label="Cobertura"
          value={`${formatDecimal(metrics.improvementRatio)}x`}
          detail="Disponibilidad vs horario humano."
          icon={Zap}
          tone="dark"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_0.9fr]">
        <CompactComparison
          variant="manual"
          title="Sin bot"
          subtitle="Consulta manual"
          icon={PhoneCall}
          items={[
            "Llamadas internas repetidas.",
            "Dependencia del horario administrativo.",
            "Cada sucursal resuelve como puede.",
            "Sin medición clara de temas frecuentes.",
          ]}
        />

        <CompactComparison
          variant="bot"
          title="Con Nubisal Bot"
          subtitle="Asistente normativo"
          icon={Bot}
          items={[
            "Disponible para todos los usuarios.",
            "Respuesta inmediata sobre normativas.",
            "Reduce interrupciones y llamados.",
            "Genera datos reales de demanda.",
          ]}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ActionCard
          title="Resumen híbrido"
          subtitle="Operativo + económico en una sola vista."
          icon={TrendingUp}
          onClick={() => setModal("overview")}
          highlight
        />
        <ActionCard
          title="Valor económico"
          subtitle="Costo, punto de equilibrio y neto anual."
          icon={DollarSign}
          onClick={() => setModal("economics")}
        />
        <ActionCard
          title="Consultas diarias"
          subtitle="Manual vs bot por día."
          icon={Activity}
          onClick={() => setModal("coverage")}
        />
        <ActionCard
          title="Consultas mensuales"
          subtitle="Por usuarios y tipo de sucursal."
          icon={Building2}
          onClick={() => setModal("monthly")}
        />
        <ActionCard
          title="Configuración"
          subtitle="Ajustar variables de simulación."
          icon={Settings2}
          onClick={() => setModal("settings")}
        />
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          Lectura comercial
        </p>
        <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-[#061f3d]">
          El bot se justifica cuando escala a toda la red operativa.
        </h2>
        <p className="mt-1 max-w-5xl text-sm leading-6 text-slate-600">
          Con {settings.totalBranches} sucursales y {usage.peoplePerBranch}{" "}
          personas por sucursal, Nubisal asiste a{" "}
          <strong>{formatNumber(metrics.assistedUsers)} usuarios</strong> y
          puede absorber aproximadamente{" "}
          <strong>{formatNumber(metrics.monthlyQueries)} consultas mensuales</strong>. 
          A un costo de <strong>{money(finance.botMonthlyCost)}</strong>, el
          costo estimado por consulta es{" "}
          <strong>{money(metrics.costPerQuery)}</strong>, con disponibilidad
          24/7 y trazabilidad centralizada.
        </p>
      </section>

      <ChartModal
        open={modal === "overview"}
        title="Resumen híbrido"
        subtitle="Impacto operativo y económico considerando usuarios reales por sucursal."
        onClose={() => setModal(null)}
      >
        <HybridOverview
          settings={settings}
          usage={usage}
          finance={finance}
          projection={projection}
        />
      </ChartModal>

      <ChartModal
        open={modal === "economics"}
        title="Valor económico generado"
        subtitle="Costo real, valor liberado por consultas y punto de equilibrio."
        onClose={() => setModal(null)}
      >
        <EconomicsDetail
          settings={settings}
          usage={usage}
          finance={finance}
          projection={projection}
        />
      </ChartModal>

      <ChartModal
        open={modal === "coverage"}
        title="Consultas diarias atendibles"
        subtitle="Comparación diaria entre esquema manual y Nubisal Bot."
        onClose={() => setModal(null)}
      >
        <CoverageChart settings={settings} usage={usage} />
      </ChartModal>

      <ChartModal
        open={modal === "monthly"}
        title="Consultas mensuales"
        subtitle="Proyección mensual por usuarios y tipo de sucursal."
        onClose={() => setModal(null)}
      >
        <MonthlyBranchProjectionChart settings={settings} usage={usage} />
      </ChartModal>

      <ChartModal
        open={modal === "availability"}
        title="Disponibilidad semanal"
        subtitle="Comparación de horas cubiertas por semana."
        onClose={() => setModal(null)}
      >
        <WeeklyAvailabilityBar
          humanHours={projection.humanWeeklyAvailability}
          botHours={projection.botWeeklyAvailability}
        />
      </ChartModal>

      <ChartModal
        open={modal === "settings"}
        title="Configuración de simulación"
        subtitle="Ajustes avanzados. Se ocultan del módulo principal para priorizar la información comercial."
        onClose={() => setModal(null)}
      >
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <h3 className="text-sm font-black text-[#061f3d]">
              Red operativa
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <NumberInput
                label="Sucursales"
                value={settings.totalBranches}
                onChange={(value) => updateSetting("totalBranches", value)}
                min={1}
              />
              <NumberInput
                label="Personas por sucursal"
                value={usage.peoplePerBranch}
                onChange={(value) => updateUsage("peoplePerBranch", value)}
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
                label="Consultas/persona/día"
                value={usage.queriesPerPersonPerDay}
                onChange={(value) =>
                  updateUsage("queriesPerPersonPerDay", value)
                }
                min={1}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <h3 className="text-sm font-black text-[#061f3d]">
              Tiempo y horario
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <NumberInput
                label="Días/mes"
                value={usage.operatingDaysPerMonth}
                onChange={(value) => updateUsage("operatingDaysPerMonth", value)}
                min={1}
                max={31}
              />
              <NumberInput
                label="Minutos consulta manual"
                value={settings.manualMinutesPerQuery}
                onChange={(value) =>
                  updateSetting("manualMinutesPerQuery", value)
                }
                min={1}
              />
              <NumberInput
                label="Días laborales"
                value={settings.workingDaysPerWeek}
                onChange={(value) => updateSetting("workingDaysPerWeek", value)}
                min={1}
                max={7}
              />
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
          </section>

          <section className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <h3 className="text-sm font-black text-[#061f3d]">
              Costos
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <NumberInput
                label="Sueldo bruto administrativo"
                value={finance.adminGrossSalary}
                onChange={(value) => updateFinance("adminGrossSalary", value)}
                min={0}
                prefix="$"
              />
              <NumberInput
                label="% cargas empleador"
                value={finance.employerChargesPercent}
                onChange={(value) =>
                  updateFinance("employerChargesPercent", value)
                }
                min={0}
              />
              <NumberInput
                label="Costo mensual bot"
                value={finance.botMonthlyCost}
                onChange={(value) => updateFinance("botMonthlyCost", value)}
                min={0}
                prefix="$"
              />
            </div>
          </section>
        </div>
      </ChartModal>
    </div>
  );
}
