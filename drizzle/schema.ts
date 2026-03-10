import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Couples ──────────────────────────────────────────────────────────────────
export const couples = mysqlTable("couples", {
  id: int("id").autoincrement().primaryKey(),
  partnerAId: int("partnerAId").notNull().references(() => users.id),
  partnerBId: int("partnerBId").references(() => users.id), // null until partner joins
  relationshipStage: mysqlEnum("relationshipStage", [
    "break-the-ice",
    "dating",
    "long-term",
  ])
    .default("dating")
    .notNull(),
  streakCount: int("streakCount").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }), // YYYY-MM-DD
  inviteCode: varchar("inviteCode", { length: 12 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Couple = typeof couples.$inferSelect;
export type InsertCouple = typeof couples.$inferInsert;

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId")
    .notNull()
    .references(() => couples.id),
  deckId: varchar("deckId", { length: 64 }).notNull(),
  questionIds: json("questionIds").$type<string[]>().notNull(), // ordered list
  connectionScore: int("connectionScore"), // 1-10
  savedMomentIds: json("savedMomentIds").$type<string[]>(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ─── Mood Entries ─────────────────────────────────────────────────────────────
export const moodEntries = mysqlTable("mood_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  coupleId: int("coupleId")
    .notNull()
    .references(() => couples.id),
  mood: mysqlEnum("mood", [
    "calm",
    "connected",
    "tired",
    "anxious",
    "grateful",
    "distant",
    "playful",
    "tender",
  ]).notNull(),
  visibleToPartner: boolean("visibleToPartner").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = typeof moodEntries.$inferInsert;

// ─── Relationship Insights ────────────────────────────────────────────────────
export const relationshipInsights = mysqlTable("relationship_insights", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId")
    .notNull()
    .references(() => couples.id),
  insightType: mysqlEnum("insightType", ["weekly", "monthly"]).notNull(),
  content: text("content").notNull(),
  themes: json("themes").$type<string[]>(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
});

export type RelationshipInsight = typeof relationshipInsights.$inferSelect;
export type InsertRelationshipInsight = typeof relationshipInsights.$inferInsert;

// ─── Saved Moments ────────────────────────────────────────────────────────────
export const savedMoments = mysqlTable("saved_moments", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId")
    .notNull()
    .references(() => couples.id),
  questionId: varchar("questionId", { length: 64 }).notNull(),
  questionText: text("questionText").notNull(),
  deckId: varchar("deckId", { length: 64 }).notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedMoment = typeof savedMoments.$inferSelect;
export type InsertSavedMoment = typeof savedMoments.$inferInsert;
