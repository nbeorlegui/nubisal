"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteCloudinaryAssetFromUrl,
  uploadNormativeToCloudinary,
} from "@/lib/cloudinary";

function cleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function revalidateAdminAndUserViews() {
  revalidatePath("/admin/documentos");
  revalidatePath("/admin/obras-sociales");
  revalidatePath("/admin/novedades");
  revalidatePath("/admin/dashboard");
  revalidatePath("/consulta");
}

async function deleteStoredFile(filePath: string | null | undefined) {
  if (!filePath) return;

  if (filePath.includes("res.cloudinary.com")) {
    await deleteCloudinaryAssetFromUrl(filePath);
  }
}

export async function createDocumentAction(formData: FormData) {
  const user = await requireAdmin();

  const title = cleanValue(formData.get("title"));
  const healthInsuranceId = cleanValue(formData.get("healthInsuranceId"));
  const file = formData.get("file");

  if (!title) {
    throw new Error("El título es obligatorio.");
  }

  if (!healthInsuranceId) {
    throw new Error("Debés seleccionar una obra social.");
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Debés subir un archivo de normativa.");
  }

  const {
    isSupportedNormativeFile,
    processNormativeBuffer,
    getSupportedNormativeFileLabel,
  } = await import("@/lib/pdf-processor");

  if (!isSupportedNormativeFile(file.name, file.type)) {
    throw new Error(
      `Formato no soportado. Subí una normativa en ${getSupportedNormativeFileLabel()}.`
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploaded = await uploadNormativeToCloudinary({
    buffer,
    fileName: file.name,
    mimeType: file.type,
  });

  const document = await prisma.document.create({
    data: {
      title,
      fileName: file.name,
      filePath: uploaded.secureUrl,
      mimeType: file.type || "application/octet-stream",
      uploadedById: user.id,
      healthInsuranceId,
      isActive: true,
    },
    include: {
      healthInsurance: true,
    },
  });

  let result: { pagesCreated: number; chunksCreated: number };

  try {
    result = await processNormativeBuffer({
      documentId: document.id,
      buffer,
      fileName: file.name,
      mimeType: file.type,
      healthInsuranceId,
    });
  } catch (error) {
    await prisma.queryResult.deleteMany({
      where: {
        documentId: document.id,
      },
    });

    await prisma.documentChunk.deleteMany({
      where: {
        documentId: document.id,
      },
    });

    await prisma.documentPage.deleteMany({
      where: {
        documentId: document.id,
      },
    });

    await prisma.document.delete({
      where: {
        id: document.id,
      },
    });

    await deleteStoredFile(uploaded.secureUrl);

    const message =
      error instanceof Error ? error.message : "No se pudo procesar el archivo.";

    throw new Error(`No se pudo procesar "${file.name}": ${message}`);
  }

  await prisma.news.create({
    data: {
      title: `Nueva normativa para ${
        document.healthInsurance?.name ?? "obra social"
      }`,
      description: `Se cargó la normativa "${document.title}" y se generaron ${result.chunksCreated} fragmentos de búsqueda.`,
      isActive: true,
    },
  });

  revalidateAdminAndUserViews();

  return {
    ok: true,
    message: "Normativa cargada correctamente.",
  };
}

export async function updateDocumentAction(formData: FormData) {
  await requireAdmin();

  const id = cleanValue(formData.get("id"));
  const title = cleanValue(formData.get("title"));
  const healthInsuranceId = cleanValue(formData.get("healthInsuranceId"));
  const isActive = cleanValue(formData.get("isActive")) === "true";

  if (!id) {
    throw new Error("Documento inválido.");
  }

  if (!title) {
    throw new Error("El título es obligatorio.");
  }

  if (!healthInsuranceId) {
    throw new Error("Debés seleccionar una obra social.");
  }

  const document = await prisma.document.update({
    where: {
      id,
    },
    data: {
      title,
      healthInsuranceId,
      isActive,
    },
    include: {
      healthInsurance: true,
    },
  });

  await prisma.news.create({
    data: {
      title: `Se actualizó una normativa`,
      description: `Se modificó la normativa "${document.title}" de ${
        document.healthInsurance?.name ?? "una obra social"
      }.`,
      isActive: true,
    },
  });

  revalidateAdminAndUserViews();

  return {
    ok: true,
    message: "Normativa actualizada correctamente.",
  };
}

export async function deleteDocumentAction(formData: FormData) {
  await requireAdmin();

  const id = cleanValue(formData.get("id"));

  if (!id) {
    throw new Error("Documento inválido.");
  }

  const document = await prisma.document.findUnique({
    where: {
      id,
    },
    select: {
      title: true,
      filePath: true,
      healthInsurance: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("El documento no existe.");
  }

  await prisma.queryResult.deleteMany({
    where: {
      documentId: id,
    },
  });

  await prisma.documentChunk.deleteMany({
    where: {
      documentId: id,
    },
  });

  await prisma.documentPage.deleteMany({
    where: {
      documentId: id,
    },
  });

  await prisma.document.delete({
    where: {
      id,
    },
  });

  await deleteStoredFile(document.filePath);

  await prisma.news.create({
    data: {
      title: `Se eliminó una normativa`,
      description: `Se eliminó la normativa "${document.title}" de ${
        document.healthInsurance?.name ?? "una obra social"
      }.`,
      isActive: true,
    },
  });

  revalidateAdminAndUserViews();

  return {
    ok: true,
    message: "Normativa eliminada correctamente.",
  };
}