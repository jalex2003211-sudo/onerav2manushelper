import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { sessions, savedMoments, couples } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const sessionRouter = router({
  /**
   * Save a completed session to the database.
   */
  save: protectedProcedure
    .input(
      z.object({
        coupleId: z.number(),
        deckId: z.string(),
        questionIds: z.array(z.string()),
        connectionScore: z.number().min(1).max(10).optional(),
        savedMoments: z
          .array(
            z.object({
              questionId: z.string(),
              questionText: z.string(),
              deckId: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const savedMomentIds = input.savedMoments?.map((m) => m.questionId) ?? [];

      const [result] = await db.insert(sessions).values({
        coupleId: input.coupleId,
        deckId: input.deckId,
        questionIds: input.questionIds,
        connectionScore: input.connectionScore ?? null,
        savedMomentIds,
      });

      // Persist saved moments
      if (input.savedMoments && input.savedMoments.length > 0) {
        for (const moment of input.savedMoments) {
          await db.insert(savedMoments).values({
            coupleId: input.coupleId,
            questionId: moment.questionId,
            questionText: moment.questionText,
            deckId: moment.deckId,
          });
        }
      }

      // Update couple's last active date
      const today = new Date().toISOString().split('T')[0];
      const [couple] = await db
        .select()
        .from(couples)
        .where(eq(couples.id, input.coupleId))
        .limit(1);

      if (couple) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak =
          couple.lastActiveDate === yesterday ? couple.streakCount + 1 : 1;
        await db
          .update(couples)
          .set({ lastActiveDate: today, streakCount: newStreak })
          .where(eq(couples.id, input.coupleId));
      }

      return { sessionId: result.insertId };
    }),

  /**
   * List past sessions for a couple.
   */
  list: protectedProcedure
    .input(z.object({ coupleId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(sessions)
        .where(eq(sessions.coupleId, input.coupleId))
        .orderBy(desc(sessions.completedAt))
        .limit(input.limit);
    }),

  /**
   * Get saved moments for a couple.
   */
  moments: protectedProcedure
    .input(z.object({ coupleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(savedMoments)
        .where(eq(savedMoments.coupleId, input.coupleId))
        .orderBy(desc(savedMoments.savedAt));
    }),
});
