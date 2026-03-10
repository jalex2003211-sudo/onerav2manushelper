export type Phase = 'warmup' | 'explore' | 'deep' | 'reflection';
export type DeckId = 'break-the-ice' | 'curiosity' | 'deep-connection' | 'intimacy' | 'reflection';
export type RelationshipStage = 'break-the-ice' | 'dating' | 'long-term';

export interface Question {
  id: string;
  text: string;
  deck: DeckId;
  phase: Phase;
}

export interface Deck {
  id: DeckId;
  name: string;
  description: string;
  color: string;
  darkColor: string;
  recommendedFor: RelationshipStage[];
}

export const DECKS: Deck[] = [
  {
    id: 'break-the-ice',
    name: 'Break the Ice',
    description: 'Light and playful questions to ease into conversation',
    color: '#D4A96A',
    darkColor: '#E4B97A',
    recommendedFor: ['break-the-ice', 'dating'],
  },
  {
    id: 'curiosity',
    name: 'Curiosity',
    description: 'Questions that spark wonder and discovery',
    color: '#8B9E7A',
    darkColor: '#9BAE8A',
    recommendedFor: ['dating', 'long-term'],
  },
  {
    id: 'deep-connection',
    name: 'Deep Connection',
    description: 'Thoughtful prompts that bring you closer',
    color: '#C4856A',
    darkColor: '#D4957A',
    recommendedFor: ['dating', 'long-term'],
  },
  {
    id: 'intimacy',
    name: 'Intimacy',
    description: 'Vulnerable and emotionally rich conversations',
    color: '#A07090',
    darkColor: '#B080A0',
    recommendedFor: ['long-term'],
  },
  {
    id: 'reflection',
    name: 'Reflection',
    description: 'Looking back and appreciating your journey together',
    color: '#7A8FA0',
    darkColor: '#8A9FB0',
    recommendedFor: ['long-term'],
  },
];

export const QUESTIONS: Question[] = [
  // --- Break the Ice Deck ---
  { id: 'bti-1', text: 'What is one thing that always makes you smile, no matter what?', deck: 'break-the-ice', phase: 'warmup' },
  { id: 'bti-2', text: 'If you could live anywhere in the world for a year, where would you go?', deck: 'break-the-ice', phase: 'warmup' },
  { id: 'bti-3', text: 'What is a small daily ritual that brings you joy?', deck: 'break-the-ice', phase: 'warmup' },
  { id: 'bti-4', text: 'What song would you pick as the soundtrack to your life right now?', deck: 'break-the-ice', phase: 'warmup' },
  { id: 'bti-5', text: 'What is the most spontaneous thing you have ever done?', deck: 'break-the-ice', phase: 'explore' },
  { id: 'bti-6', text: 'What is something you are quietly proud of that most people do not know?', deck: 'break-the-ice', phase: 'explore' },
  { id: 'bti-7', text: 'What is a dream you have never told anyone about?', deck: 'break-the-ice', phase: 'deep' },
  { id: 'bti-8', text: 'What does a perfect evening look like to you?', deck: 'break-the-ice', phase: 'reflection' },

  // --- Curiosity Deck ---
  { id: 'cur-1', text: 'What is something you have always wanted to learn but never made time for?', deck: 'curiosity', phase: 'warmup' },
  { id: 'cur-2', text: 'What is a belief you held five years ago that you no longer hold?', deck: 'curiosity', phase: 'warmup' },
  { id: 'cur-3', text: 'What is the most interesting conversation you have had recently?', deck: 'curiosity', phase: 'warmup' },
  { id: 'cur-4', text: 'What is something about the world that still genuinely amazes you?', deck: 'curiosity', phase: 'explore' },
  { id: 'cur-5', text: 'If you could have dinner with anyone from history, who would it be and why?', deck: 'curiosity', phase: 'explore' },
  { id: 'cur-6', text: 'What is a question you keep returning to but have never found an answer to?', deck: 'curiosity', phase: 'explore' },
  { id: 'cur-7', text: 'What is something you wish you understood better about yourself?', deck: 'curiosity', phase: 'deep' },
  { id: 'cur-8', text: 'What has changed most about how you see the world in the last few years?', deck: 'curiosity', phase: 'deep' },
  { id: 'cur-9', text: 'What is something you are still figuring out?', deck: 'curiosity', phase: 'reflection' },
  { id: 'cur-10', text: 'What is one thing you hope to understand better by the end of this year?', deck: 'curiosity', phase: 'reflection' },

  // --- Deep Connection Deck ---
  { id: 'dc-1', text: 'When did you last feel truly seen by someone?', deck: 'deep-connection', phase: 'warmup' },
  { id: 'dc-2', text: 'What does feeling loved look like to you in everyday moments?', deck: 'deep-connection', phase: 'warmup' },
  { id: 'dc-3', text: 'What is something you find difficult to ask for, even when you need it?', deck: 'deep-connection', phase: 'explore' },
  { id: 'dc-4', text: 'When did you last feel truly supported by your partner?', deck: 'deep-connection', phase: 'explore' },
  { id: 'dc-5', text: 'What is a fear you carry quietly that you rarely talk about?', deck: 'deep-connection', phase: 'deep' },
  { id: 'dc-6', text: 'What is something you have been wanting to say but have not found the right moment?', deck: 'deep-connection', phase: 'deep' },
  { id: 'dc-7', text: 'What does emotional safety mean to you in a relationship?', deck: 'deep-connection', phase: 'deep' },
  { id: 'dc-8', text: 'What is one thing your partner does that makes you feel most at home?', deck: 'deep-connection', phase: 'reflection' },
  { id: 'dc-9', text: 'What is something you appreciate about how your partner handles difficulty?', deck: 'deep-connection', phase: 'reflection' },
  { id: 'dc-10', text: 'What is a moment from our time together that you return to often?', deck: 'deep-connection', phase: 'reflection' },

  // --- Intimacy Deck ---
  { id: 'int-1', text: 'What is something your partner does that makes you feel most understood?', deck: 'intimacy', phase: 'warmup' },
  { id: 'int-2', text: 'What is a small gesture that means a lot to you?', deck: 'intimacy', phase: 'warmup' },
  { id: 'int-3', text: 'What is something you wish your partner knew about how you experience love?', deck: 'intimacy', phase: 'explore' },
  { id: 'int-4', text: 'When do you feel most connected to your partner?', deck: 'intimacy', phase: 'explore' },
  { id: 'int-5', text: 'What is something you have been afraid to be fully honest about?', deck: 'intimacy', phase: 'deep' },
  { id: 'int-6', text: 'What is a part of yourself you are still learning to share with your partner?', deck: 'intimacy', phase: 'deep' },
  { id: 'int-7', text: 'What does vulnerability feel like for you, and when does it feel safe?', deck: 'intimacy', phase: 'deep' },
  { id: 'int-8', text: 'What is something you want your partner to know about how much they matter to you?', deck: 'intimacy', phase: 'reflection' },
  { id: 'int-9', text: 'What is a way you have grown because of this relationship?', deck: 'intimacy', phase: 'reflection' },
  { id: 'int-10', text: 'What is something you want to nurture more in your relationship?', deck: 'intimacy', phase: 'reflection' },

  // --- Reflection Deck ---
  { id: 'ref-1', text: 'What is a memory from early in our relationship that you still treasure?', deck: 'reflection', phase: 'warmup' },
  { id: 'ref-2', text: 'What is something we have built together that you are proud of?', deck: 'reflection', phase: 'warmup' },
  { id: 'ref-3', text: 'What is a challenge we have faced that made us stronger?', deck: 'reflection', phase: 'explore' },
  { id: 'ref-4', text: 'What is something you have learned about yourself through this relationship?', deck: 'reflection', phase: 'explore' },
  { id: 'ref-5', text: 'What is a moment when you felt our relationship shift in a meaningful way?', deck: 'reflection', phase: 'deep' },
  { id: 'ref-6', text: 'What is something you wish we had done differently, and what would you do now?', deck: 'reflection', phase: 'deep' },
  { id: 'ref-7', text: 'What does the future of our relationship look like to you?', deck: 'reflection', phase: 'deep' },
  { id: 'ref-8', text: 'What is something you want to say thank you for that you have never said out loud?', deck: 'reflection', phase: 'reflection' },
  { id: 'ref-9', text: 'What is one thing you hope we always keep doing together?', deck: 'reflection', phase: 'reflection' },
  { id: 'ref-10', text: 'What is your favorite thing about who we are together?', deck: 'reflection', phase: 'reflection' },
];

export const DAILY_QUESTIONS: string[] = [
  'What is one thing that happened today that you want to share with me?',
  'What is something small that brought you joy today?',
  'What is one thing you are grateful for about our relationship right now?',
  'What is something you have been thinking about lately that you have not shared yet?',
  'What is one thing I could do this week to make you feel more loved?',
  'What is a moment from this week that you want to remember?',
  'What is something you are looking forward to together?',
  'What is one way you have felt supported recently?',
  'What is something you appreciate about how we communicate?',
  'What is a small dream you have for us?',
  'What is one thing you admire about your partner right now?',
  'What is something you have been wanting to do together?',
  'What is a quality in your partner that you noticed this week?',
  'What is one thing you wish we talked about more?',
];

export function getDailyQuestion(): string {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % DAILY_QUESTIONS.length;
  return DAILY_QUESTIONS[dayIndex];
}

export function getDecksForStage(stage: RelationshipStage): Deck[] {
  return DECKS.filter(d => d.recommendedFor.includes(stage));
}

export function buildSession(deckId: DeckId, count: number = 10): Question[] {
  const deckQuestions = QUESTIONS.filter(q => q.deck === deckId);
  const phases: Phase[] = ['warmup', 'explore', 'deep', 'reflection'];
  const result: Question[] = [];

  const perPhase = Math.ceil(count / phases.length);

  for (const phase of phases) {
    const phaseQs = deckQuestions.filter(q => q.phase === phase);
    const shuffled = [...phaseQs].sort(() => Math.random() - 0.5);
    result.push(...shuffled.slice(0, perPhase));
  }

  // If the primary deck doesn't have enough questions to fill the requested count,
  // pad with questions from other decks in the same phase order to preserve
  // the emotional arc (warmup → explore → deep → reflection).
  if (result.length < count) {
    const usedIds = new Set(result.map(q => q.id));
    const fallback = QUESTIONS
      .filter(q => q.deck !== deckId && !usedIds.has(q.id))
      .sort((a, b) => phases.indexOf(a.phase) - phases.indexOf(b.phase));
    for (const q of fallback) {
      if (result.length >= count) break;
      result.push(q);
    }
  }

  return result.slice(0, count);
}
