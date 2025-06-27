import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botSessions = pgTable("bot_sessions", {
  id: serial("id").primaryKey(),
  botId: text("bot_id").notNull().unique(),
  botToken: text("bot_token").notNull(),
  botUsername: text("bot_username").notNull(),
  botDiscriminator: text("bot_discriminator"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const botMessages = pgTable("bot_messages", {
  id: serial("id").primaryKey(),
  botId: text("bot_id").notNull(),
  targetType: text("target_type").notNull(), // 'channel' or 'user'
  targetId: text("target_id").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  success: boolean("success").default(false),
  errorMessage: text("error_message"),
});

export const botGuilds = pgTable("bot_guilds", {
  id: serial("id").primaryKey(),
  botId: text("bot_id").notNull(),
  guildId: text("guild_id").notNull(),
  guildName: text("guild_name").notNull(),
  guildIcon: text("guild_icon"),
  memberCount: integer("member_count"),
  permissions: text("permissions"),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const botStats = pgTable("bot_stats", {
  id: serial("id").primaryKey(),
  botId: text("bot_id").notNull(),
  ping: integer("ping"),
  uptime: integer("uptime"), // in seconds
  memoryUsage: integer("memory_usage"), // in MB
  guildCount: integer("guild_count"),
  userCount: integer("user_count"),
  status: text("status").notNull().default("online"), // online, idle, dnd, invisible
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  botId: text("bot_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  isFromBot: boolean("is_from_bot").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBotSessionSchema = createInsertSchema(botSessions).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export const insertBotMessageSchema = createInsertSchema(botMessages).omit({
  id: true,
  sentAt: true,
});

export const insertBotGuildSchema = createInsertSchema(botGuilds).omit({
  id: true,
  joinedAt: true,
});

export const insertBotStatsSchema = createInsertSchema(botStats).omit({
  id: true,
  recordedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type BotSession = typeof botSessions.$inferSelect;
export type InsertBotSession = z.infer<typeof insertBotSessionSchema>;
export type BotMessage = typeof botMessages.$inferSelect;
export type InsertBotMessage = z.infer<typeof insertBotMessageSchema>;
export type BotGuild = typeof botGuilds.$inferSelect;
export type InsertBotGuild = z.infer<typeof insertBotGuildSchema>;
export type BotStats = typeof botStats.$inferSelect;
export type InsertBotStats = z.infer<typeof insertBotStatsSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
