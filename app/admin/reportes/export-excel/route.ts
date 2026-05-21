import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export async function GET() {
  await requireAdmin();

  const queries = await prisma.query.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
    include: {
      user: { select: { name: true } },
      branch: { select: { name: true } },
      detectedHealthInsurance: { select: { name: true } },
    },
  });

  const rows = [
    ["Fecha", "Consulta", "Usuario", "Sucursal", "Obra social", "Con respuesta", "Score"],
    ...queries.map((query: any) => [
      query.createdAt.toISOString(),
      query.originalText,
      query.user?.name ?? "Usuario",
      query.branch?.name ?? "Sin sucursal",
      query.detectedHealthInsurance?.name ?? "No detectada",
      query.resultFound ? "Sí" : "No",
      query.topScore,
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nubisal-reportes.csv"',
    },
  });
}
