import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type QueryForReport = {
  id: string;
  originalText: string;
  resultFound: boolean;
  topScore: number;
  createdAt: Date;
  user: { name: string } | null;
  branch: { name: string } | null;
  detectedHealthInsurance: { name: string } | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateParam(value: string | null, fallback: Date) {
  if (!value) return fallback;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateRange(request: Request) {
  const url = new URL(request.url);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultStart = addDays(today, -13);
  const defaultEnd = today;

  let start = parseDateParam(url.searchParams.get("startDate"), defaultStart);
  let end = parseDateParam(url.searchParams.get("endDate"), defaultEnd);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start > end) {
    const previousStart = start;
    start = end;
    end = previousStart;
  }

  return {
    start,
    end,
    endExclusive: addDays(end, 1),
    label: `${toDateInputValue(start)} al ${toDateInputValue(end)}`,
  };
}

function getDaysBetween(start: Date, end: Date) {
  const days: { key: string; name: string }[] = [];
  const cursor = new Date(start);
  let guard = 0;

  while (cursor <= end && guard < 62) {
    days.push({
      key: cursor.toISOString().slice(0, 10),
      name: cursor.toLocaleDateString("es-AR", {
        weekday: "short",
        day: "2-digit",
      }),
    });

    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }

  return days;
}

function groupCount<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function barRows(data: { name: string; value: number }[]) {
  const max = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) {
    return `<div class="empty">Sin datos suficientes.</div>`;
  }

  return data
    .map((item) => {
      const width = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0);

      return `
        <div class="bar-row">
          <div class="bar-label">${escapeHtml(item.name)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%">${item.value > 0 ? item.value : ""}</div>
          </div>
          <div class="bar-value">${item.value}</div>
        </div>
      `;
    })
    .join("");
}

function dailyBars(data: { name: string; value: number }[]) {
  const max = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) {
    return `<div class="empty">Sin datos suficientes.</div>`;
  }

  return `
    <div class="daily-chart">
      ${data
        .map((item) => {
          const height = Math.max((item.value / max) * 120, item.value > 0 ? 10 : 2);
          return `
            <div class="daily-item">
              <div class="daily-bar-wrap">
                <div class="daily-bar" style="height:${height}px"></div>
              </div>
              <div class="daily-label">${escapeHtml(item.name)}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function responseBlock(withResponse: number, total: number) {
  const percentage = total > 0 ? Math.round((withResponse / total) * 100) : 0;
  const withoutResponse = Math.max(total - withResponse, 0);

  return `
    <div class="response-card">
      <div class="response-main">
        <div>
          <div class="eyebrow">Resueltas</div>
          <div class="response-percent">${percentage}%</div>
        </div>
        <div class="response-icon">✓</div>
      </div>
      <div class="progress">
        <div class="progress-fill" style="width:${percentage}%"></div>
      </div>
      <div class="response-grid">
        <div><strong>${withResponse}</strong><span>Con respuesta</span></div>
        <div><strong>${withoutResponse}</strong><span>Sin respuesta</span></div>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  await requireAdmin();

  const range = getDateRange(request);
  const days = getDaysBetween(range.start, range.end);

  const [
    queries,
    usersCount,
    branchesCount,
    activeHealthInsurancesCount,
    documentsCount,
  ] = await Promise.all([
    prisma.query.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lt: range.endExclusive,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
        detectedHealthInsurance: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.branch.count({ where: { isActive: true } }),
    prisma.healthInsurance.count({ where: { isActive: true } }),
    prisma.document.count({ where: { isActive: true } }),
  ]);

  const typedQueries = queries as QueryForReport[];
  const totalQueries = typedQueries.length;
  const withResponse = typedQueries.filter((query) => query.resultFound).length;
  const responseRate =
    totalQueries > 0 ? Math.round((withResponse / totalQueries) * 100) : 0;

  const queriesByDay = days.map((day) => ({
    name: day.name,
    value: typedQueries.filter(
      (query) => query.createdAt.toISOString().slice(0, 10) === day.key
    ).length,
  }));

  const queriesByBranch = groupCount(
    typedQueries,
    (query) => query.branch?.name ?? "Sin sucursal"
  ).slice(0, 8);

  const queriesByHealthInsurance = groupCount(
    typedQueries,
    (query) => query.detectedHealthInsurance?.name ?? "No detectada"
  ).slice(0, 8);

  const latestRows = typedQueries
    .slice(0, 10)
    .map(
      (query) => `
        <tr>
          <td>${escapeHtml(query.originalText)}</td>
          <td>${escapeHtml(query.user?.name ?? "Usuario")}</td>
          <td>${escapeHtml(query.branch?.name ?? "Sin sucursal")}</td>
          <td>${escapeHtml(query.detectedHealthInsurance?.name ?? "No detectada")}</td>
          <td>${query.resultFound ? "Con respuesta" : "Sin respuesta"}</td>
          <td>${query.createdAt.toLocaleDateString("es-AR")}</td>
        </tr>
      `
    )
    .join("");

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Nubisal - Reporte ejecutivo</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #f3f7fb;
      color: #061f3d;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
    }

    .page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 18px;
    }

    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      background: #061f3d;
      color: white;
      border-radius: 22px;
      padding: 22px;
      margin-bottom: 14px;
    }

    .hero h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1;
      letter-spacing: -1px;
    }

    .hero p {
      margin: 8px 0 0;
      color: #cfe6ff;
      line-height: 1.5;
    }

    .badge {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 16px;
      padding: 12px 14px;
      min-width: 230px;
    }

    .badge strong {
      display: block;
      font-size: 26px;
      line-height: 1;
    }

    .badge span {
      display: block;
      margin-top: 5px;
      color: #cfe6ff;
      font-size: 11px;
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }

    .kpi {
      background: white;
      border: 1px solid #dbe5f0;
      border-radius: 16px;
      padding: 12px;
    }

    .kpi .label,
    .eyebrow {
      color: #64748b;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.4px;
    }

    .kpi .value {
      margin-top: 5px;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -1px;
    }

    .kpi .detail {
      margin-top: 4px;
      color: #64748b;
      font-size: 10px;
      line-height: 1.4;
    }

    .grid {
      display: grid;
      grid-template-columns: 1.35fr 0.65fr;
      gap: 10px;
      margin-bottom: 10px;
    }

    .grid.two {
      grid-template-columns: repeat(2, 1fr);
    }

    .card {
      background: white;
      border: 1px solid #dbe5f0;
      border-radius: 16px;
      padding: 14px;
      break-inside: avoid;
    }

    .card h2 {
      margin: 0;
      font-size: 15px;
      letter-spacing: -0.3px;
    }

    .card p {
      margin: 4px 0 12px;
      color: #64748b;
      font-size: 10px;
    }

    .daily-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 168px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 10px 10px;
    }

    .daily-item {
      flex: 1;
      min-width: 0;
      text-align: center;
    }

    .daily-bar-wrap {
      height: 122px;
      display: flex;
      justify-content: center;
      align-items: flex-end;
    }

    .daily-bar {
      width: 18px;
      max-width: 80%;
      background: #062f73;
      border-radius: 8px 8px 0 0;
    }

    .daily-label {
      margin-top: 8px;
      color: #94a3b8;
      font-size: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 110px 1fr 36px;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .bar-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar-track {
      height: 24px;
      border-radius: 999px;
      background: #f1f5f9;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 999px;
      background: #062f73;
      color: white;
      font-size: 9px;
      font-weight: 900;
      display: flex;
      align-items: center;
      padding-left: 8px;
    }

    .bar-value {
      font-size: 10px;
      font-weight: 900;
      text-align: right;
    }

    .response-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
    }

    .response-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .response-percent {
      margin-top: 4px;
      font-size: 38px;
      line-height: 1;
      font-weight: 900;
      letter-spacing: -1px;
    }

    .response-icon {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      background: #10b981;
      color: white;
      display: grid;
      place-items: center;
      font-weight: 900;
      font-size: 18px;
    }

    .progress {
      margin-top: 14px;
      height: 14px;
      background: #fee2e2;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 999px;
    }

    .response-grid {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .response-grid div {
      background: white;
      border-radius: 10px;
      padding: 8px;
    }

    .response-grid strong {
      display: block;
      color: #061f3d;
      font-size: 16px;
    }

    .response-grid span {
      display: block;
      color: #64748b;
      font-size: 9px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }

    th {
      text-align: left;
      color: #64748b;
      font-size: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 7px 5px;
      border-bottom: 1px solid #e2e8f0;
    }

    td {
      padding: 7px 5px;
      border-bottom: 1px solid #eef2f7;
      color: #334155;
      vertical-align: top;
    }

    .empty {
      height: 148px;
      border: 1px dashed #cbd5e1;
      border-radius: 14px;
      display: grid;
      place-items: center;
      color: #94a3b8;
      background: #f8fafc;
      font-weight: 700;
    }

    .actions {
      margin: 14px 0;
      display: flex;
      gap: 8px;
    }

    .actions button {
      height: 36px;
      border: none;
      border-radius: 10px;
      background: #062f73;
      color: white;
      padding: 0 14px;
      font-weight: 800;
      cursor: pointer;
    }

    .actions a {
      height: 36px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: white;
      color: #062f73;
      padding: 0 14px;
      font-weight: 800;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }

    @media print {
      body {
        background: white;
      }

      .actions {
        display: none;
      }

      .page {
        max-width: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div>
        <h1>Nubisal - Reporte ejecutivo</h1>
        <p>Rango analizado: ${range.label}. Indicadores reales del bot, consultas, respuestas, sucursales, obras sociales y normativas.</p>
      </div>
      <div class="badge">
        <strong>${responseRate}%</strong>
        <span>consultas con respuesta suficiente</span>
      </div>
    </section>

    <div class="actions">
      <button onclick="window.print()">Imprimir / Guardar como PDF</button>
      <a href="/admin/reportes">Volver a reportes</a>
    </div>

    <section class="kpis">
      <article class="kpi">
        <div class="label">Consultas</div>
        <div class="value">${totalQueries}</div>
        <div class="detail">Consultas registradas en el rango.</div>
      </article>
      <article class="kpi">
        <div class="label">Resolución</div>
        <div class="value">${responseRate}%</div>
        <div class="detail">${withResponse} con respuesta suficiente.</div>
      </article>
      <article class="kpi">
        <div class="label">Obras sociales</div>
        <div class="value">${activeHealthInsurancesCount}</div>
        <div class="detail">Activas para consulta.</div>
      </article>
      <article class="kpi">
        <div class="label">Normativas</div>
        <div class="value">${documentsCount}</div>
        <div class="detail">Documentos normativos activos.</div>
      </article>
    </section>

    <section class="grid">
      <article class="card">
        <h2>Consultas por día</h2>
        <p>Distribución de consultas en el rango seleccionado.</p>
        ${dailyBars(queriesByDay)}
      </article>

      <article class="card">
        <h2>Consultas con respuesta</h2>
        <p>Nivel de resolución del bot.</p>
        ${responseBlock(withResponse, totalQueries)}
      </article>
    </section>

    <section class="grid two">
      <article class="card">
        <h2>Consultas por sucursal</h2>
        <p>Ranking de sucursales que más consultan.</p>
        ${barRows(queriesByBranch)}
      </article>

      <article class="card">
        <h2>Obras sociales más consultadas</h2>
        <p>Ranking por consultas detectadas.</p>
        ${barRows(queriesByHealthInsurance)}
      </article>
    </section>

    <section class="card">
      <h2>Últimas consultas</h2>
      <p>Últimas 10 consultas registradas en el rango seleccionado.</p>
      <table>
        <thead>
          <tr>
            <th>Consulta</th>
            <th>Usuario</th>
            <th>Sucursal</th>
            <th>Obra social</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${
            latestRows ||
            `<tr><td colspan="6">No hay consultas para el rango seleccionado.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  </div>

  <script>
    setTimeout(() => {
      window.print();
    }, 600);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
