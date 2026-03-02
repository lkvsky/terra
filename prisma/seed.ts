import { PrismaClient, Role } from "@prisma/client";
import { PROPERTIES } from "../lib/properties";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Upsert properties
  for (const property of PROPERTIES) {
    await prisma.property.upsert({
      where: { id: property.id },
      update: {
        name: property.name,
        description: property.description,
        location: property.location,
        imageUrl: property.imageUrl,
      },
      create: {
        id: property.id,
        name: property.name,
        description: property.description,
        location: property.location,
        imageUrl: property.imageUrl,
      },
    });
    console.log(`  Upserted property: ${property.name}`);
  }

  // Set admin roles
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  for (const email of adminEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { role: Role.ADMIN },
      });
      console.log(`  Set ADMIN role for: ${email}`);
    } else {
      console.log(`  User not found (will be set on first login): ${email}`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
