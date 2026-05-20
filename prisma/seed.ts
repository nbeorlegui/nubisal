import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const branchCentro = await prisma.branch.upsert({
    where: { code: "SUC-001" },
    update: {},
    create: {
      name: "Sucursal Centro",
      code: "SUC-001",
      address: "Mendoza Centro",
      city: "Mendoza",
      province: "Mendoza",
    },
  });

  const branchGodoyCruz = await prisma.branch.upsert({
    where: { code: "SUC-002" },
    update: {},
    create: {
      name: "Sucursal Godoy Cruz",
      code: "SUC-002",
      address: "Godoy Cruz",
      city: "Godoy Cruz",
      province: "Mendoza",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@farmabot.com" },
    update: {
      username: "admin",
    },
    create: {
      name: "Administrador",
      username: "admin",
      email: "admin@farmabot.com",
      passwordHash,
      role: UserRole.ADMIN,
      branchId: branchCentro.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "maria@farmabot.com" },
    update: {
      username: "maria",
    },
    create: {
      name: "María López",
      username: "maria",
      email: "maria@farmabot.com",
      passwordHash: await bcrypt.hash("usuario123", 10),
      role: UserRole.USER,
      branchId: branchGodoyCruz.id,
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
    await prisma.healthInsurance.upsert({
      where: { code: item.code },
      update: {},
      create: {
        name: item.name,
        code: item.code,
      },
    });
  }

  console.log("Seed finalizado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });