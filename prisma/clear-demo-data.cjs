const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando datos demo...");

  await prisma.queryResult.deleteMany();
  await prisma.query.deleteMany();

  await prisma.documentChunk.deleteMany();
  await prisma.documentPage.deleteMany();
  await prisma.document.deleteMany();

  await prisma.news.deleteMany();
  await prisma.healthInsurance.deleteMany();

  await prisma.user.deleteMany({
    where: {
      role: "USER",
    },
  });

  await prisma.user.updateMany({
    where: {
      role: "ADMIN",
    },
    data: {
      branchId: null,
    },
  });

  await prisma.branch.deleteMany();

  console.log("Base limpia.");
  console.log("Se conservaron los usuarios ADMIN.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });