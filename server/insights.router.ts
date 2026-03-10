import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { relationshipInsights } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const insightsRouter = router({
  /**
   * Get all insights for a couple.
   */
  list: protectedProcedure
    .input(z.object({ coupleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(relationshipInsights)
        .where(eq(relationshipInsights.coupleId, input.coupleId))
        .orderBy(desc(relationshipInsights.generatedAt))
        .limit(12);
    }),

  /**
   * Save a generated insight to the database.
   */
  save: protectedProcedure
    .input(
      z.object({
        coupleId: z.number(),
        insightType: z.enum(['weekly', 'monthly']),
        content: z.string(),
        themes: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [result] = await db.insert(relationshipInsights).values({
        coupleId: input.coupleId,
        insightType: input.insightType,
        content: input.content,
        themes: input.themes ?? [],
      });

      return { id: result.insertId };
    }),
});
