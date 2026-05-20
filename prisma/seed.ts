import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "node:process";

const prisma = new PrismaClient();

async function upsertHealthInsuranceByCode(item: {
  name: string;
  code: string;
}) {
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
  const userPasswordHash = await bcrypt.hash("usuario123", 10);

  const branchCentro = await prisma.branch.upsert({
    where: {
      code: "SUC-001",
    },
    update: {
      name: "Sucursal Centro",
      address: "Mendoza Centro",
      city: "Mendoza",
      province: "Mendoza",
      isActive: true,
    },
    create: {
      name: "Sucursal Centro",
      code: "SUC-001",
      address: "Mendoza Centro",
      city: "Mendoza",
      province: "Mendoza",
      isActive: true,
    },
  });

  const branchGodoyCruz = await prisma.branch.upsert({
    where: {
      code: "SUC-002",
    },
    update: {
      name: "Sucursal Godoy Cruz",
      address: "Godoy Cruz",
      city: "Godoy Cruz",
      province: "Mendoza",
      isActive: true,
    },
    create: {
      name: "Sucursal Godoy Cruz",
      code: "SUC-002",
      address: "Godoy Cruz",
      city: "Godoy Cruz",
      province: "Mendoza",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "admin@farmabot.com",
    },
    update: {
      name: "Administrador",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      branchId: branchCentro.id,
      isActive: true,
    },
    create: {
      name: "Administrador",
      username: "admin",
      email: "admin@farmabot.com",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      branchId: branchCentro.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "maria@farmabot.com",
    },
    update: {
      name: "María López",
      username: "maria",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      branchId: branchGodoyCruz.id,
      isActive: true,
    },
    create: {
      name: "María López",
      username: "maria",
      email: "maria@farmabot.com",
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      branchId: branchGodoyCruz.id,
      isActive: true,
    },
  });

  const healthInsurances = [
    { name: "UNIMED", code: "UNIMED" },
    { name: "SWISS MEDICAL", code: "SWISS_MEDICAL" },
    { name: "SWISS ART", code: "SWISS_ART" },
    { name: "GALENO ART", code: "GALENO_ART" },
    { name: "PAMI", code: "PAMI" },
    { name: "OSDE", code: "OSDE" },
    { name: "OSECAC", code: "OSECAC" },
    { name: "IOMA", code: "IOMA" },
  ];

  for (const item of healthInsurances) {
    await upsertHealthInsuranceByCode(item);
  }

  await prisma.news.create({
    data: {
      title: "Nubisal inicializado",
      description:
        "Se cargaron los datos iniciales del sistema: sucursales, usuarios y obras sociales base.",
      isActive: true,
    },
  });

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