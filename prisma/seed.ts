import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "node:process";

const prisma = new PrismaClient();

type AppUserRole = "ADMIN" | "USER";

async function upsertHealthInsuranceByCode(item: { name: string; code: string }) {
  const existing = await prisma.healthInsurance.findFirst({
    where: {
      code: item.code,
    },
  });

  if (existing) {
    await prisma.healthInsurance.update({
      where: {
        id: existing.id,
      },
      data: {
        name: item.name,
        code: item.code,
        isActive: true,
      },
    });

    return;
  }

  await prisma.healthInsurance.create({
    data: {
      name: item.name,
      code: item.code,
      isActive: true,
    },
  });
}

async function main() {
  console.log("Iniciando seed...");

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const userPasswordHash = await bcrypt.hash("bamba", 10);

  const branchCentro = await prisma.branch.upsert({
    where: {
      code: "SUC-001",
    },
    update: {
      name: "Del Plata 1",
      address: "Mendoza",
      city: "Mendoza",
      province: "Mendoza",
      isActive: true,
    },
    create: {
      name: "Del Plata 1",
      code: "SUC-001",
      address: "Mendoza",
      city: "Mendoza",
      province: "Mendoza",
      isActive: true,
    },
  });

  const adminRole: AppUserRole = "ADMIN";
  const userRole: AppUserRole = "USER";

  await prisma.user.upsert({
    where: {
      email: "admin@nubisal.com",
    },
    update: {
      name: "Administrador",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: adminRole,
      branchId: branchCentro.id,
      isActive: true,
    },
    create: {
      name: "Administrador",
      username: "admin",
      email: "admin@nubisal.com",
      passwordHash: adminPasswordHash,
      role: adminRole,
      branchId: branchCentro.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "gbamba@nubisal.com",
    },
    update: {
      name: "Gisela Bamba",
      username: "gbamba",
      passwordHash: userPasswordHash,
      role: userRole,
      branchId: branchCentro.id,
      isActive: true,
    },
    create: {
      name: "Gisela Bamba",
      username: "gbamba",
      email: "gbamba@nubisal.com",
      passwordHash: userPasswordHash,
      role: userRole,
      branchId: branchCentro.id,
      isActive: true,
    },
  });

  const healthInsurances = [
    { name: "PAMI", code: "PAMI" },
    { name: "OSDE", code: "OSDE" },
    { name: "OSECAC", code: "OSECAC" },
    { name: "IOMA", code: "IOMA" },
    { name: "SWISS MEDICAL", code: "SWISS_MEDICAL" },
    { name: "GALENO ART", code: "GALENO_ART" },
    { name: "LA SEGUNDA ART", code: "LA_SEGUNDA_ART" },
  ];

  for (const item of healthInsurances) {
    await upsertHealthInsuranceByCode(item);
  }

  console.log("Seed finalizado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
