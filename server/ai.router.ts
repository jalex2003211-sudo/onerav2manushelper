import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from './_core/trpc';
import { invokeLLM } from './_core/llm';

export const aiRouter = router({
  /**
   * Generate an AI follow-up question for a session card.
   * Takes the original question and optional answer text.
   */
  followUp: protectedProcedure
    .input(
      z.object({
        originalQuestion: z.string(),
        answerText: z.string().optional(),
        phase: z.enum(['warmup', 'explore', 'deep', 'reflection']),
        relationshipStage: z.enum(['break-the-ice', 'dating', 'long-term']),
        deckId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { originalQuestion, answerText, phase, relationshipStage } = input;

      const systemPrompt = `You are an emotionally intelligent conversation guide for a couples connection app called Onera.
Your role is to generate thoughtful follow-up questions that help couples go deeper in their conversations.
You write with warmth, care, and emotional intelligence. You never use clinical language.`;

      const userPrompt = `Generate ONE follow-up question for a couple in a guided conversation session.

Context:
- Relationship stage: ${relationshipStage}
- Current session phase: ${phase}
- Original question: "${originalQuestion}"
${answerText ? `- A partner's answer: "${answerText}"` : ''}

Requirements:
1. Build naturally on the original question${answerText ? ' and the answer given' : ''}
2. Go one level deeper emotionally
3. Be specific and personal, not generic
4. Feel like it came from a thoughtful friend, not a therapist
5. Be 15-25 words maximum
6. Do NOT repeat the original question

Return ONLY the question text, nothing else.`;

      const result = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 100,
      });

      const text = result.choices[0]?.message?.content;
      const question = typeof text === 'string' ? text.trim().replace(/^["']|["']$/g, '') : null;

      if (!question) {
        throw new Error('AI did not return a valid follow-up question');
      }

      return { question };
    }),

  /**
   * Generate an AI-powered daily question personalized to the couple.
   */
  dailyQuestion: protectedProcedure
    .input(
      z.object({
        relationshipStage: z.enum(['break-the-ice', 'dating', 'long-term']),
        recentThemes: z.array(z.string()).optional(),
        streakCount: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { relationshipStage, recentThemes, streakCount } = input;

      const systemPrompt = `You are a thoughtful conversation curator for Onera, a premium couples connection app.
You create daily questions that feel personal, warm, and meaningful — never generic or clinical.`;

      const userPrompt = `Create ONE daily question for a couple to reflect on together.

Context:
- Relationship stage: ${relationshipStage}
${recentThemes && recentThemes.length > 0 ? `- Recent conversation themes: ${recentThemes.join(', ')}` : ''}
${streakCount ? `- They have been connecting for ${streakCount} days in a row` : ''}

Requirements:
1. The question should feel fresh and specific to their stage
2. It should be answerable in 1-3 minutes
3. It should invite genuine reflection, not just facts
4. 15-30 words maximum
5. Avoid questions about conflict or problems — focus on appreciation, curiosity, and connection

Return ONLY the question text.`;

      const result = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 80,
      });

      const text = result.choices[0]?.message?.content;
      const question = typeof text === 'string' ? text.trim().replace(/^["']|["']$/g, '') : null;

      return { question: question ?? null };
    }),

  /**
   * Generate a monthly relationship insight based on couple activity.
   */
  monthlyInsight: protectedProcedure
    .input(
      z.object({
        sessionCount: z.number(),
        themes: z.array(z.string()),
        moodSummary: z.string().optional(),
        streakCount: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { sessionCount, themes, moodSummary, streakCount } = input;

      const systemPrompt = `You are writing warm, personal relationship insights for couples using Onera.
You write in second person ("you both") with warmth and emotional intelligence.
You never diagnose, prescribe, or use clinical language.`;

      const userPrompt = `Write a monthly relationship insight for a couple.

Their activity this month:
- Sessions completed: ${sessionCount}
- Most explored themes: ${themes.length > 0 ? themes.join(', ') : 'connection and curiosity'}
${moodSummary ? `- Mood patterns: ${moodSummary}` : ''}
- Current streak: ${streakCount} days

Write a 120-160 word insight that:
1. Reflects what you observe in their patterns with warmth
2. Uses "you both" language throughout
3. Acknowledges their effort and consistency
4. Ends with a gentle, specific invitation to reflect or try something
5. Feels personal and crafted, not templated

Do not use bullet points. Write in flowing paragraphs.`;

      const result = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 300,
      });

      const text = result.choices[0]?.message?.content;
      const content = typeof text === 'string' ? text.trim() : null;

      if (!content) {
        throw new Error('AI did not return a valid insight');
      }

      return { content, themes };
    }),

  /**
   * Generate a weekly insight for the couple.
   */
  weeklyInsight: protectedProcedure
    .input(
      z.object({
        sessionCount: z.number(),
        streakCount: z.number(),
        recentDecks: z.array(z.string()),
        avgConnectionScore: z.number().optional(),
        partnerAName: z.string(),
        partnerBName: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { sessionCount, streakCount, recentDecks, avgConnectionScore, partnerAName, partnerBName } = input;

      const systemPrompt = `You are writing warm, personal relationship insights for couples using Onera.
You write in second person with warmth and emotional intelligence.
You never diagnose, prescribe, or use clinical language.`;

      const userPrompt = `Write a weekly relationship insight for ${partnerAName} and ${partnerBName}.

Their activity this week:
- Sessions completed: ${sessionCount}
- Decks explored: ${recentDecks.join(', ')}
${avgConnectionScore ? `- Average connection score: ${avgConnectionScore}/10` : ''}
- Current streak: ${streakCount} days

Write a 80-120 word insight that:
1. Reflects what you observe in their patterns with warmth
2. Uses their names naturally
3. Acknowledges their effort
4. Ends with a gentle invitation
5. Feels personal and crafted, not templated

Also return 2-3 theme keywords (single words like "curiosity", "gratitude", "vulnerability").

Format your response as:
INSIGHT: [the insight text]
THEMES: [comma-separated themes]`;

      const result = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 300,
      });

      const rawContent = result.choices[0]?.message?.content;
      const text = typeof rawContent === 'string' ? rawContent : '';
      const insightMatch = text.match(/INSIGHT:\s*(.+?)(?=THEMES:|$)/s);
      const themesMatch = text.match(/THEMES:\s*(.+)/);

      const insight = insightMatch?.[1]?.trim() ?? text.trim();
      const themes = themesMatch?.[1]?.split(',').map((t: string) => t.trim()).filter(Boolean) ?? [];

      return { insight, themes };
    }),

  /**
   * Generate a weekly reflection prompt.
   */
  weeklyReflection: publicProcedure
    .input(
      z.object({
        sessionCount: z.number(),
        streakCount: z.number(),
        relationshipStage: z.enum(['break-the-ice', 'dating', 'long-term']),
      }),
    )
    .query(async ({ input }) => {
      const { sessionCount, streakCount, relationshipStage } = input;

      const systemPrompt = `You are a thoughtful guide for couples using Onera.
You write weekly reflection prompts that are warm, specific, and inviting.`;

      const userPrompt = `Write a weekly reflection prompt for a couple.

Context:
- Sessions this week: ${sessionCount}
- Current streak: ${streakCount} days
- Relationship stage: ${relationshipStage}

Write ONE reflection prompt (20-35 words) that:
1. Acknowledges the week they've had together
2. Invites a specific kind of reflection
3. Feels like a gentle Sunday evening question
4. Is warm and personal, not generic

Return ONLY the prompt text.`;

      const result = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        maxTokens: 80,
      });

      const text = result.choices[0]?.message?.content;
      const prompt = typeof text === 'string' ? text.trim().replace(/^["']|["']$/g, '') : null;

      return { prompt: prompt ?? null };
    }),
});
