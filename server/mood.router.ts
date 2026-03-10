import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { moodEntries, couples } from '../drizzle/schema';
import { eq, desc, and, or } from 'drizzle-orm';

const MOOD_VALUES = ['calm', 'connected', 'tired', 'anxious', 'grateful', 'distant', 'playful', 'tender'] as const;

export const moodRouter = router({
  /**
   * Log a mood entry for the current user.
   */
  log: protectedProcedure
    .input(
      z.object({
        coupleId: z.number(),
        mood: z.enum(MOOD_VALUES),
        visibleToPartner: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [result] = await db.insert(moodEntries).values({
        userId: ctx.user.id,
        coupleId: input.coupleId,
        mood: input.mood,
        visibleToPartner: input.visibleToPartner,
      });

      return { id: result.insertId };
    }),

  /**
   * Get recent mood entries for the couple (both partners).
   */
  recent: protectedProcedure
    .input(z.object({ coupleId: z.number(), limit: z.number().default(14) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(moodEntries)
        .where(eq(moodEntries.coupleId, input.coupleId))
        .orderBy(desc(moodEntries.createdAt))
        .limit(input.limit);
    }),

  /**
   * Get partner's latest visible mood.
   */
  partnerMood: protectedProcedure
    .input(z.object({ coupleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      // Get the couple to find partner's ID
      const [couple] = await db
        .select()
        .from(couples)
        .where(eq(couples.id, input.coupleId))
        .limit(1);

      if (!couple) return null;

      const partnerId =
        couple.partnerAId === ctx.user.id ? couple.partnerBId : couple.partnerAId;

      if (!partnerId) return null;

      const [entry] = await db
        .select()
        .from(moodEntries)
        .where(
          and(
            eq(moodEntries.userId, partnerId),
            eq(moodEntries.coupleId, input.coupleId),
            eq(moodEntries.visibleToPartner, true),
          ),
        )
        .orderBy(desc(moodEntries.createdAt))
        .limit(1);

      return entry ?? null;
    }),
});
