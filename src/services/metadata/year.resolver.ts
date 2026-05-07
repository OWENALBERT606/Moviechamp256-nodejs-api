import { PrismaClient } from "@prisma/client";

export async function resolveYear(
  dateString: string | null,
  prisma: PrismaClient
): Promise<string | null> {
  if (!dateString) return null;

  try {
    const value = new Date(dateString).getFullYear();
    if (isNaN(value)) return null;

    const record = await prisma.releaseYear.upsert({
      where:  { value },
      create: { value },
      update: {},
    });
    return record.id;
  } catch (e: any) {
    console.error("[year.resolver] resolveYear error:", e.message);
    return null;
  }
}
