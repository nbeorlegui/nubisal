"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createBranchAction(formData: FormData) {
  await requireAdmin();

  const name = cleanValue(formData.get("name"));
  const code = cleanValue(formData.get("code"));
  const address = cleanValue(formData.get("address"));
  const city = cleanValue(formData.get("city"));
  const province = cleanValue(formData.get("province"));
  const isActive = cleanValue(formData.get("isActive")) !== "false";

  if (!name) {
    throw new Error("El nombre de la sucursal es obligatorio.");
  }

  await prisma.branch.create({
    data: {
      name,
      code: code || null,
      address: address || null,
      city: city || null,
      province: province || null,
      isActive,
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/dashboard");
}

export async function updateBranchAction(formData: FormData) {
  await requireAdmin();

  const id = cleanValue(formData.get("id"));
  const name = cleanValue(formData.get("name"));
  const code = cleanValue(formData.get("code"));
  const address = cleanValue(formData.get("address"));
  const city = cleanValue(formData.get("city"));
  const province = cleanValue(formData.get("province"));
  const isActive = cleanValue(formData.get("isActive")) === "true";

  if (!id) {
    throw new Error("Sucursal inválida.");
  }

  if (!name) {
    throw new Error("El nombre de la sucursal es obligatorio.");
  }

  await prisma.branch.update({
    where: { id },
    data: {
      name,
      code: code || null,
      address: address || null,
      city: city || null,
      province: province || null,
      isActive,
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/dashboard");
}

export async function deleteBranchAction(formData: FormData) {
  await requireAdmin();

  const id = cleanValue(formData.get("id"));

  if (!id) {
    throw new Error("Sucursal inválida.");
  }

  const usersCount = await prisma.user.count({
    where: {
      branchId: id,
    },
  });

  if (usersCount > 0) {
    throw new Error(
      "No se puede eliminar la sucursal porque tiene usuarios asociados. Podés desactivarla."
    );
  }

  await prisma.branch.delete({
    where: { id },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/dashboard");
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const name = cleanValue(formData.get("name"));
  const username = cleanValue(formData.get("username"));
  const email = cleanValue(formData.get("email"));
  const password = cleanValue(formData.get("password"));
  const role = cleanValue(formData.get("role")) as "ADMIN" | "USER";
  const branchId = cleanValue(formData.get("branchId"));
  const isActive = cleanValue(formData.get("isActive")) !== "false";

  if (!name || !username || !email || !password) {
    throw new Error("Nombre, usuario, email y contraseña son obligatorios.");
  }

  if (!["ADMIN", "USER"].includes(role)) {
    throw new Error("Rol inválido.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash,
      role,
      branchId: branchId || null,
      isActive,
    },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/dashboard");
}

export async function updateUserAction(formData: FormData) {
  const currentUser = await requireAdmin();

  const id = cleanValue(formData.get("id"));
  const name = cleanValue(formData.get("name"));
  const username = cleanValue(formData.get("username"));
  const email = cleanValue(formData.get("email"));
  const password = cleanValue(formData.get("password"));
  const role = cleanValue(formData.get("role")) as "ADMIN" | "USER";
  const branchId = cleanValue(formData.get("branchId"));
  const isActive = cleanValue(formData.get("isActive")) === "true";

  if (!id) {
    throw new Error("Usuario inválido.");
  }

  if (!name || !username || !email) {
    throw new Error("Nombre, usuario y email son obligatorios.");
  }

  if (!["ADMIN", "USER"].includes(role)) {
    throw new Error("Rol inválido.");
  }

  const data: {
    name: string;
    username: string;
    email: string;
    role: "ADMIN" | "USER";
    branchId: string | null;
    isActive: boolean;
    passwordHash?: string;
  } = {
    name,
    username,
    email,
    role,
    branchId: branchId || null,
    isActive,
  };

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  if (currentUser.id === id && !isActive) {
    throw new Error("No podés desactivar tu propio usuario.");
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/dashboard");
}

export async function deleteUserAction(formData: FormData) {
  const currentUser = await requireAdmin();

  const id = cleanValue(formData.get("id"));

  if (!id) {
    throw new Error("Usuario inválido.");
  }

  if (currentUser.id === id) {
    throw new Error("No podés eliminar tu propio usuario.");
  }

  const [documentsCount, queriesCount] = await Promise.all([
    prisma.document.count({
      where: {
        uploadedById: id,
      },
    }),
    prisma.query.count({
      where: {
        userId: id,
      },
    }),
  ]);

  if (documentsCount > 0 || queriesCount > 0) {
    throw new Error(
      "No se puede eliminar este usuario porque tiene documentos o consultas asociadas. Podés desactivarlo."
    );
  }

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/dashboard");
}