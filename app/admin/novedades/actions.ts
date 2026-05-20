"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createNewsAction(formData: FormData) {
  await requireAdmin();

  const title = cleanValue(formData.get("title"));
  const description = cleanValue(formData.get("description"));

  if (!title || !description) {
    throw new Error("Título y descripción son obligatorios.");
  }

  await prisma.news.create({
    data: {
      title,
      description,
      isActive: true,
    },
  });

  revalidatePath("/admin/novedades");
  revalidatePath("/consulta");
}

export async function updateNewsAction(formData: FormData) {
  await requireAdmin();

  const id = cleanValue(formData.get("id"));
  const title = cleanValue(formData.get("title"));
  const description = cleanValue(formData.get("description"));
  const isActive = cleanValue(formData.get("isActive")) === "true";

  if (!id) {
    throw new Error("Novedad inválida.");
  }

  if (!title || !description) {
    throw new Error("Título y descripción son obligatorios.");
  }

  await prisma.news.update({
    where: { id },
    data: {
      title,
      description,
      isActive,
    },
  });

  revalidatePath("/admin/novedades");
  revalidatePath("/consulta");
}

export async function deleteNewsAction(formData: FormData) {
  await requireAdmin();

  const id = cleanValue(formData.get("id"));

  if (!id) {
    throw new Error("Novedad inválida.");
  }

  await prisma.news.delete({
    where: { id },
  });

  revalidatePath("/admin/novedades");
  revalidatePath("/consulta");
}