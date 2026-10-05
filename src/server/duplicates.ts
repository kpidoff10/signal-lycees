import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { normalize } from "@/lib/text";
import type { CategoryId } from "@/lib/categories";
import { embed, toVectorLiteral } from "./embeddings";

export interface DuplicateCandidate {
  id: string;
  title: string;
  description: string;
  upCount: number;
  createdAt: Date;
  similarity: number;
}

/**
 * Problèmes publiés et non résolus du même lycée et de la même catégorie,
 * proches sémantiquement du nouveau texte. Ne fusionne jamais rien : on propose,
 * l'élève décide.
 */
export async function findDuplicates(input: {
  schoolId: string;
  category: CategoryId;
  title: string;
  description: string;
  vector?: number[] | null;
}): Promise<DuplicateCandidate[]> {
  const text = `${input.title}. ${input.description}`;
  const vector = input.vector !== undefined ? input.vector : await embed(text);

  if (vector) {
    const rows = await prisma.$queryRawUnsafe<DuplicateCandidate[]>(
      `SELECT id, title, description, "upCount", "createdAt", 1 - (embedding <=> $1::vector) AS similarity
         FROM "Issue"
        WHERE "schoolId" = $2 AND category = $3::"IssueCategory"
          AND "moderationStatus" IN ('PUBLISHED', 'AUTO_APPROVED') AND status <> 'RESOLVED'
          AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT 3`,
      toVectorLiteral(vector),
      input.schoolId,
      input.category,
    );
    return rows.filter((r) => Number(r.similarity) >= env().DUPLICATE_THRESHOLD).map((r) => ({ ...r, similarity: Number(r.similarity) }));
  }

  const rows = await prisma.$queryRaw<DuplicateCandidate[]>`
    SELECT id, title, description, "upCount", "createdAt",
           GREATEST(
             similarity(lower(unaccent(title)), ${normalize(input.title)}),
             word_similarity(${normalize(text)}, lower(unaccent(title || ' ' || description)))
           ) AS similarity
      FROM "Issue"
     WHERE "schoolId" = ${input.schoolId} AND category = ${input.category}::"IssueCategory"
       AND "moderationStatus" IN ('PUBLISHED', 'AUTO_APPROVED') AND status <> 'RESOLVED'
     ORDER BY similarity DESC
     LIMIT 3`;
  return rows
    .map((r) => ({ ...r, similarity: Number(r.similarity) }))
    .filter((r) => r.similarity >= env().DUPLICATE_TRGM_THRESHOLD);
}
