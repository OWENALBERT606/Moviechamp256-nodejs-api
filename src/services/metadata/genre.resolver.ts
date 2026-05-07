import { PrismaClient } from "@prisma/client";

export async function resolveGenre(
  tmdbGenreName: string,
  prisma: PrismaClient
): Promise<string> {
  const slug = tmdbGenreName.toLowerCase().replace(/\s+/g, "-");

  // 1. Try by slug
  let genre = await prisma.genre.findUnique({ where: { slug } });
  if (genre) return genre.id;

  // 2. Try case-insensitive name match
  genre = await prisma.genre.findFirst({
    where: { name: { equals: tmdbGenreName, mode: "insensitive" } },
  });
  if (genre) return genre.id;

  // 3. Create it
  genre = await prisma.genre.create({
    data: { name: tmdbGenreName, slug },
  });
  return genre.id;
}
