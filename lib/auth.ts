import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export type AppUserRole = "ADMIN" | "USER";

const SESSION_COOKIE_NAME = "farmabot_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Falta AUTH_SECRET en el archivo .env");
  }

  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  branchId: string | null;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }

    const role = String(payload.role) === "ADMIN" ? "ADMIN" : "USER";

    return {
      id: String(payload.id),
      name: String(payload.name ?? ""),
      email: String(payload.email),
      role,
      branchId: payload.branchId ? String(payload.branchId) : null,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.id,
      isActive: true,
    },
    include: {
      branch: true,
    },
  });

  if (!user) {
    await logout();
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/consulta");
  }

  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
