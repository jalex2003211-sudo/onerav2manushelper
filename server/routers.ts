import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aiRouter } from "./ai.router";
import { coupleRouter } from "./couple.router";
import { sessionRouter } from "./session.router";
import { moodRouter } from "./mood.router";
import { insightsRouter } from "./insights.router";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Onera v2 Feature Routers ────────────────────────────────────────────
  ai: aiRouter,
  couple: coupleRouter,
  session: sessionRouter,
  mood: moodRouter,
  insights: insightsRouter,
});

export type AppRouter = typeof appRouter;
