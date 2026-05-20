"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return {
      error: "Ingresá usuario y contraseña.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.isActive) {
    return {
      error: "Usuario o contraseña incorrectos.",
    };
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    return {
      error: "Usuario o contraseña incorrectos.",
    };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
  });

  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  redirect("/consulta");
}
