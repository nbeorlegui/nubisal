"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  deleteCloudinaryAssetFromUrl,
  uploadNormativeToCloudinary,
} from "@/lib/cloudinary";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string, defaultValue = true) {
  const value = formData.get(key);

  if (value === null) return defaultValue;

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return Boolean(value);
}

function getRealFiles(formData: FormData) {
  return formData.getAll("files").filter((file): file is File => {
    return (
      typeof File !== "undefined" &&
      file instanceof File &&
      file.size > 0 &&
      file.name.trim() !== ""
    );
  });
}

async function createNews({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  await prisma.news.create({
    data: {
      title,
      description,
      isActive: true,
    },
  });
}

async function deleteStoredFile(filePath: string | null | undefined) {
  if (!filePath) return;

  if (filePath.includes("res.cloudinary.com")) {
    await deleteCloudinaryAssetFromUrl(filePath);
  }
}

async function saveNormativeFiles({
  formData,
  healthInsuranceId,
  uploadedById,
  defaultTitle,
}: {
  formData: FormData;
  healthInsuranceId: string;
  uploadedById: string;
  defaultTitle: string;
}) {
  const files = getRealFiles(formData);

  if (files.length === 0) {
    return {
      documentsCreated: 0,
      chunksCreated: 0,
    };
  }

  const { isSupportedNormativeFile, processNormativeBuffer } = await import(
    "@/lib/pdf-processor"
  );

  const rawTitle = getString(formData, "documentTitle");

  let documentsCreated = 0;
  let chunksCreated = 0;

  for (const file of files) {
    if (!isSupportedNormativeFile(file)) {
      throw new Error(
        `El archivo "${file.name}" no tiene un formato soportado. Subí PDF, DOCX, TXT, MD, CSV o RTF.`
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
        title: rawTitle || defaultTitle || file.name,
        fileName: file.name,
        filePath: uploaded.secureUrl,
        mimeType: file.type || "application/octet-stream",
        uploadedById,
        healthInsuranceId,
        isActive: true,
      },
      include: {
        healthInsurance: true,
      },
    });

    try {
      const result = await processNormativeBuffer({
        documentId: document.id,
        buffer,
        fileName: file.name,
        mimeType: file.type,
        healthInsuranceId,
      });

      documentsCreated += 1;
      chunksCreated += result.chunksCreated;
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
        error instanceof Error
          ? error.message
          : "No se pudo procesar el archivo.";

      throw new Error(`No se pudo procesar "${file.name}". ${message}`);
    }
  }

  return {
    documentsCreated,
    chunksCreated,
  };
}

function revalidateHealthInsurancePaths() {
  revalidatePath("/admin/obras-sociales");
  revalidatePath("/admin/documentos");
  revalidatePath("/admin/novedades");
  revalidatePath("/consulta");
  revalidatePath("/admin/dashboard");
}

export async function createHealthInsuranceAction(formData: FormData) {
  const admin = await requireAdmin();

  const name = getString(formData, "name");
  const code = getString(formData, "code");
  const description = getString(formData, "description");
  const isActive = getBoolean(formData, "isActive", true);

  if (!name) {
    throw new Error("El nombre de la obra social es obligatorio.");
  }

  const existing = await prisma.healthInsurance.findFirst({
    where: {
      OR: [
        {
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        ...(code
          ? [
              {
                code: {
                  equals: code,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
    },
  });

  if (existing) {
    throw new Error("Ya existe una obra social con ese nombre o código.");
  }

  const healthInsurance = await prisma.healthInsurance.create({
    data: {
      name,
      code: code || null,
      description: description || null,
      isActive,
    },
  });

  try {
    const normativeResult = await saveNormativeFiles({
      formData,
      healthInsuranceId: healthInsurance.id,
      uploadedById: admin.id,
      defaultTitle: `Normativa ${healthInsurance.name}`,
    });

    await createNews({
      title: `Nueva obra social: ${healthInsurance.name}`,
      description: `Se creó la obra social ${healthInsurance.name}.`,
    });

    if (normativeResult.documentsCreated > 0) {
      await createNews({
        title: `Nueva normativa para ${healthInsurance.name}`,
        description: `Se cargaron ${normativeResult.documentsCreated} normativa(s) y se generaron ${normativeResult.chunksCreated} fragmentos de búsqueda.`,
      });
    }

    revalidateHealthInsurancePaths();

    return {
      ok: true,
      message: "Obra social creada correctamente.",
    };
  } catch (error) {
    const documents = await prisma.document.findMany({
      where: {
        healthInsuranceId: healthInsurance.id,
      },
    });

    const documentIds = documents.map((document) => document.id);

    if (documentIds.length > 0) {
      await prisma.queryResult.deleteMany({
        where: {
          documentId: {
            in: documentIds,
          },
        },
      });

      await prisma.documentChunk.deleteMany({
        where: {
          documentId: {
            in: documentIds,
          },
        },
      });

      await prisma.documentPage.deleteMany({
        where: {
          documentId: {
            in: documentIds,
          },
        },
      });

      await prisma.document.deleteMany({
        where: {
          id: {
            in: documentIds,
          },
        },
      });
    }

    await prisma.healthInsurance.delete({
      where: {
        id: healthInsurance.id,
      },
    });

    for (const document of documents) {
      await deleteStoredFile(document.filePath);
    }

    throw error;
  }
}

export async function updateHealthInsuranceAction(formData: FormData) {
  await requireAdmin();

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const code = getString(formData, "code");
  const description = getString(formData, "description");
  const isActive = getBoolean(formData, "isActive", true);

  if (!id) {
    throw new Error("Falta el ID de la obra social.");
  }

  if (!name) {
    throw new Error("El nombre de la obra social es obligatorio.");
  }

  const previous = await prisma.healthInsurance.findUnique({
    where: {
      id,
    },
  });

  if (!previous) {
    throw new Error("La obra social no existe.");
  }

  const duplicated = await prisma.healthInsurance.findFirst({
    where: {
      id: {
        not: id,
      },
      OR: [
        {
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        ...(code
          ? [
              {
                code: {
                  equals: code,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
    },
  });

  if (duplicated) {
    throw new Error("Ya existe otra obra social con ese nombre o código.");
  }

  const healthInsurance = await prisma.healthInsurance.update({
    where: {
      id,
    },
    data: {
      name,
      code: code || null,
      description: description || null,
      isActive,
    },
  });

  if (previous.isActive !== isActive) {
    await createNews({
      title: `${healthInsurance.name} fue ${
        isActive ? "habilitada" : "deshabilitada"
      }`,
      description: `La obra social ${healthInsurance.name} quedó ${
        isActive ? "habilitada" : "deshabilitada"
      } para consultas.`,
    });
  } else {
    await createNews({
      title: `Obra social actualizada: ${healthInsurance.name}`,
      description: `Se actualizaron los datos de la obra social ${healthInsurance.name}.`,
    });
  }

  revalidateHealthInsurancePaths();

  return {
    ok: true,
    message: "Obra social actualizada correctamente.",
  };
}

export async function uploadDocumentToHealthInsuranceAction(formData: FormData) {
  const admin = await requireAdmin();

  const healthInsuranceId = getString(formData, "healthInsuranceId");

  if (!healthInsuranceId) {
    throw new Error("Falta la obra social.");
  }

  const healthInsurance = await prisma.healthInsurance.findUnique({
    where: {
      id: healthInsuranceId,
    },
  });

  if (!healthInsurance) {
    throw new Error("La obra social no existe.");
  }

  const files = getRealFiles(formData);

  if (files.length === 0) {
    throw new Error("Seleccioná al menos un archivo de normativa.");
  }

  const result = await saveNormativeFiles({
    formData,
    healthInsuranceId,
    uploadedById: admin.id,
    defaultTitle: `Normativa ${healthInsurance.name}`,
  });

  await createNews({
    title: `Nueva normativa para ${healthInsurance.name}`,
    description: `Se cargaron ${result.documentsCreated} normativa(s) para ${healthInsurance.name} y se generaron ${result.chunksCreated} fragmentos de búsqueda.`,
  });

  revalidateHealthInsurancePaths();

  return {
    ok: true,
    message: "Normativa cargada correctamente.",
  };
}

export async function deleteDocumentFromHealthInsuranceAction(
  formData: FormData
) {
  await requireAdmin();

  const documentId = getString(formData, "documentId");

  if (!documentId) {
    throw new Error("Falta el ID de la normativa.");
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
    include: {
      healthInsurance: true,
    },
  });

  if (!document) {
    throw new Error("La normativa no existe.");
  }

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

  await deleteStoredFile(document.filePath);

  await createNews({
    title: `Normativa eliminada: ${document.title}`,
    description: `Se eliminó la normativa "${document.title}" de ${
      document.healthInsurance?.name ?? "la obra social"
    }.`,
  });

  revalidateHealthInsurancePaths();

  return {
    ok: true,
    message: "Normativa eliminada correctamente.",
  };
}

export async function deleteHealthInsuranceAction(formData: FormData) {
  await requireAdmin();

  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Falta el ID de la obra social.");
  }

  const healthInsurance = await prisma.healthInsurance.findUnique({
    where: {
      id,
    },
    include: {
      documents: true,
    },
  });

  if (!healthInsurance) {
    throw new Error("La obra social no existe.");
  }

  const documentIds = healthInsurance.documents.map((document) => document.id);

  if (documentIds.length > 0) {
    await prisma.queryResult.deleteMany({
      where: {
        documentId: {
          in: documentIds,
        },
      },
    });

    await prisma.documentChunk.deleteMany({
      where: {
        documentId: {
          in: documentIds,
        },
      },
    });

    await prisma.documentPage.deleteMany({
      where: {
        documentId: {
          in: documentIds,
        },
      },
    });

    await prisma.document.deleteMany({
      where: {
        id: {
          in: documentIds,
        },
      },
    });
  }

  await prisma.query.updateMany({
    where: {
      detectedHealthInsuranceId: id,
    },
    data: {
      detectedHealthInsuranceId: null,
    },
  });

  await prisma.healthInsurance.delete({
    where: {
      id,
    },
  });

  for (const document of healthInsurance.documents) {
    await deleteStoredFile(document.filePath);
  }

  await createNews({
    title: `Obra social eliminada: ${healthInsurance.name}`,
    description: `Se eliminó la obra social ${healthInsurance.name} y sus normativas asociadas.`,
  });

  revalidateHealthInsurancePaths();

  return {
    ok: true,
    message: "Obra social eliminada correctamente.",
  };
}

export async function uploadNormativeForHealthInsuranceAction(
  formData: FormData
) {
  return uploadDocumentToHealthInsuranceAction(formData);
}
