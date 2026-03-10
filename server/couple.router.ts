import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { couples, users } from '../drizzle/schema';
import { eq, or } from 'drizzle-orm';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const coupleRouter = router({
  /**
   * Create a new couple (called by the first partner during setup).
   */
  create: protectedProcedure
    .input(
      z.object({
        partnerAName: z.string().min(1),
        partnerAAvatar: z.string(),
        relationshipStage: z.enum(['break-the-ice', 'dating', 'long-term']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const inviteCode = generateInviteCode();
      const [result] = await db.insert(couples).values({
        partnerAId: ctx.user.id,
        relationshipStage: input.relationshipStage,
        inviteCode,
        streakCount: 0,
      });

      return {
        coupleId: result.insertId,
        inviteCode,
      };
    }),

  /**
   * Join an existing couple using an invite code.
   */
  join: protectedProcedure
    .input(z.object({ inviteCode: z.string().length(8) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [couple] = await db
        .select()
        .from(couples)
        .where(eq(couples.inviteCode, input.inviteCode.toUpperCase()))
        .limit(1);

      if (!couple) {
        throw new Error('Invite code not found');
      }

      if (couple.partnerBId) {
        throw new Error('This couple already has two partners');
      }

      if (couple.partnerAId === ctx.user.id) {
        throw new Error('You cannot join your own couple');
      }

      await db
        .update(couples)
        .set({ partnerBId: ctx.user.id })
        .where(eq(couples.id, couple.id));

      return { coupleId: couple.id };
    }),

  /**
   * Get the current user's couple with partner info.
   */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [couple] = await db
      .select()
      .from(couples)
      .where(
        or(
          eq(couples.partnerAId, ctx.user.id),
          eq(couples.partnerBId, ctx.user.id),
        ),
      )
      .limit(1);

    if (!couple) return null;

    const [partnerA] = await db
      .select()
      .from(users)
      .where(eq(users.id, couple.partnerAId))
      .limit(1);

    const partnerB = couple.partnerBId
      ? (await db.select().from(users).where(eq(users.id, couple.partnerBId)).limit(1))[0]
      : null;

    return {
      ...couple,
      partnerA: partnerA ?? null,
      partnerB: partnerB ?? null,
    };
  }),

  /**
   * Update couple settings (relationship stage).
   */
  update: protectedProcedure
    .input(
      z.object({
        coupleId: z.number(),
        relationshipStage: z.enum(['break-the-ice', 'dating', 'long-term']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [couple] = await db
        .select()
        .from(couples)
        .where(eq(couples.id, input.coupleId))
        .limit(1);

      if (!couple) throw new Error('Couple not found');
      if (couple.partnerAId !== ctx.user.id && couple.partnerBId !== ctx.user.id) {
        throw new Error('Not authorized');
      }

      const updates: Partial<typeof couples.$inferInsert> = {};
      if (input.relationshipStage) updates.relationshipStage = input.relationshipStage;

      await db.update(couples).set(updates).where(eq(couples.id, input.coupleId));

      return { success: true };
    }),

  /**
   * Mark today as active and update streak.
   */
  markActive: protectedProcedure
    .input(z.object({ coupleId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const today = new Date().toISOString().split('T')[0];

      const [couple] = await db
        .select()
        .from(couples)
        .where(eq(couples.id, input.coupleId))
        .limit(1);

      if (!couple) throw new Error('Couple not found');
      if (couple.lastActiveDate === today) return { streakCount: couple.streakCount };

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = couple.lastActiveDate === yesterday ? couple.streakCount + 1 : 1;

      await db
        .update(couples)
        .set({ lastActiveDate: today, streakCount: newStreak })
        .where(eq(couples.id, input.coupleId));

      return { streakCount: newStreak };
    }),
});
