"use client";

import { useState } from "react";
import {
  Building2,
  Clock3,
  Search,
  Stethoscope,
  X,
} from "lucide-react";

type SimpleData = { label: string; value: number };

type DashboardProps = {
  userName: string;
  stats: {
    queriesCount: number;
    branchesCount: number;
    healthInsurancesCount: number;
  };
  queriesPerDay: SimpleData[];
  frequentQueries: SimpleData[];
  userQueries: SimpleData[];
  insuranceStatus: {
    active: number;
    inactive: number;
  };
};

type ModalData =
  | {
      title: string;
      subtitle: string;
      type: "columns" | "bars";
      data: SimpleData[];
    }
  | {
      title: string;
      subtitle: string;
      type: "status";
      active: number;
      inactive: number;
    }
  | null;

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-[#061f3d]">
            {value}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5ff] text-[#062f73]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  onDetail,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onDetail: () => void;
}) {
  return (
    <article className="flex h-[285px] w-full max-w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[#061f3d]">
            {title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onDetail}
          className="shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Ver detalle
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-50 px-2 py-2 sm:px-3">
        {children}
      </div>
    </article>
  );
}

function SmallColumns({
  data,
  color = "#062f73",
}: {
  data: SimpleData[];
  color?: string;
}) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white/60 text-sm text-slate-400">
        Sin datos registrados
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-full w-full min-w-0 items-end gap-1.5 sm:gap-2.5">
      {data.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
        >
          <div className="flex h-[125px] w-full min-w-0 items-end rounded-lg bg-white px-1 py-2 sm:px-2">
            <div
              className="w-full rounded-md"
              style={{
                backgroundColor: color,
                height:
                  item.value > 0
                    ? `${Math.max((item.value / max) * 100, 8)}%`
                    : "0%",
              }}
            />
          </div>

          <span className="max-w-full truncate text-[9px] text-slate-500 sm:text-[10px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SmallBars({ data }: { data: SimpleData[] }) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white/60 text-sm text-slate-400">
        Sin consultas registradas
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-full w-full min-w-0 flex-col justify-between">
      {data.slice(0, 5).map((item) => (
        <div key={item.label} className="min-w-0">
          <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[11px]">
            <span className="min-w-0 truncate text-slate-600">
              {item.label}
            </span>
            <span className="shrink-0 font-semibold text-[#061f3d]">
              {item.value}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[#12b8c8]"
              style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SmallStatus({
  active,
  inactive,
}: {
  active: number;
  inactive: number;
}) {
  const total = active + inactive;

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-white/60 text-sm text-slate-400">
        Sin obras sociales cargadas
      </div>
    );
  }

  const activePercent = Math.round((active / total) * 100);
  const inactivePercent = Math.round((inactive / total) * 100);

  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <div>
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-slate-600">Activas</span>
          <span className="font-semibold text-[#061f3d]">
            {active} · {activePercent}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[#062f73]"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-slate-600">Desactivadas</span>
          <span className="font-semibold text-[#061f3d]">
            {inactive} · {inactivePercent}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-[#12b8c8]"
            style={{ width: `${inactivePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ModalColumns({ data }: { data: SimpleData[] }) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
        Sin datos registrados
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <div className="flex h-[320px] items-end gap-5">
        {data.map((item) => (
          <div
            key={item.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="text-sm font-semibold text-[#061f3d]">
              {item.value}
            </span>

            <div className="flex h-[230px] w-full items-end rounded-xl bg-white px-3 py-3">
              <div
                className="w-full rounded-lg bg-[#062f73]"
                style={{ height: `${Math.max((item.value / max) * 100, 5)}%` }}
              />
            </div>

            <span className="max-w-full truncate text-xs text-slate-500">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalBars({ data }: { data: SimpleData[] }) {
  const hasData = data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
        Sin consultas registradas
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-semibold text-[#061f3d]">{item.value}</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[#12b8c8]"
              style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalStatus({
  active,
  inactive,
}: {
  active: number;
  inactive: number;
}) {
  const total = active + inactive;

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
        Sin obras sociales cargadas
      </div>
    );
  }

  const activePercent = Math.round((active / total) * 100);
  const inactivePercent = Math.round((inactive / total) * 100);

  return (
    <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
      <div className="rounded-2xl bg-white p-6">
        <p className="text-sm text-slate-500">Activas</p>
        <p className="mt-2 text-4xl font-semibold text-[#061f3d]">{active}</p>
        <p className="mt-1 text-sm text-slate-500">{activePercent}% del total</p>
      </div>

      <div className="rounded-2xl bg-white p-6">
        <p className="text-sm text-slate-500">Desactivadas</p>
        <p className="mt-2 text-4xl font-semibold text-[#061f3d]">{inactive}</p>
        <p className="mt-1 text-sm text-slate-500">
          {inactivePercent}% del total
        </p>
      </div>
    </div>
  );
}

function DetailModal({
  modal,
  onClose,
}: {
  modal: ModalData;
  onClose: () => void;
}) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 py-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#061f3d]">
              {modal.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{modal.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {modal.type === "columns" ? <ModalColumns data={modal.data} /> : null}
        {modal.type === "bars" ? <ModalBars data={modal.data} /> : null}
        {modal.type === "status" ? (
          <ModalStatus active={modal.active} inactive={modal.inactive} />
        ) : null}
      </div>
    </div>
  );
}

export default function AdminDashboardClient({
  userName,
  stats,
  queriesPerDay,
  frequentQueries,
  userQueries,
  insuranceStatus,
}: DashboardProps) {
  const [modal, setModal] = useState<ModalData>(null);

  return (
    <>
      <header className="mb-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#061f3d]">
            Bienvenido, {userName}
          </h2>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
          <Clock3 className="h-4 w-4" />
          Hoy
        </div>
      </header>

      <section className="grid min-w-0 gap-3 md:grid-cols-3">
        <KpiCard
          label="Consultas"
          value={stats.queriesCount}
          detail="Total registradas"
          icon={Search}
        />
        <KpiCard
          label="Obras sociales"
          value={stats.healthInsurancesCount}
          detail="Activas en sistema"
          icon={Stethoscope}
        />
        <KpiCard
          label="Sucursales"
          value={stats.branchesCount}
          detail="Registradas"
          icon={Building2}
        />
      </section>

      <section className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
        <ChartCard
          title="Consultas por día"
          subtitle="Evolución de uso del sistema."
          onDetail={() =>
            setModal({
              title: "Consultas por día",
              subtitle: "Detalle completo de consultas registradas.",
              type: "columns",
              data: queriesPerDay,
            })
          }
        >
          <SmallColumns data={queriesPerDay} />
        </ChartCard>

        <ChartCard
          title="Consultas frecuentes"
          subtitle="Términos más consultados."
          onDetail={() =>
            setModal({
              title: "Consultas frecuentes",
              subtitle: "Ranking completo de búsquedas frecuentes.",
              type: "bars",
              data: frequentQueries,
            })
          }
        >
          <SmallBars data={frequentQueries} />
        </ChartCard>

        <ChartCard
          title="Consultas por usuario"
          subtitle="Comparativo entre colaboradores."
          onDetail={() =>
            setModal({
              title: "Consultas por usuario",
              subtitle: "Detalle de consultas realizadas por colaborador.",
              type: "columns",
              data: userQueries,
            })
          }
        >
          <SmallColumns data={userQueries} color="#12b8c8" />
        </ChartCard>

        <ChartCard
          title="Obras sociales"
          subtitle="Activas y desactivadas."
          onDetail={() =>
            setModal({
              title: "Obras sociales",
              subtitle: "Estado general de obras sociales cargadas.",
              type: "status",
              active: insuranceStatus.active,
              inactive: insuranceStatus.inactive,
            })
          }
        >
          <SmallStatus
            active={insuranceStatus.active}
            inactive={insuranceStatus.inactive}
          />
        </ChartCard>
      </section>

      <DetailModal modal={modal} onClose={() => setModal(null)} />
    </>
  );
}