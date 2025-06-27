import { 
  botSessions, 
  botMessages, 
  botGuilds, 
  botStats, 
  chatMessages,
  type BotSession, 
  type InsertBotSession,
  type BotMessage,
  type InsertBotMessage,
  type BotGuild,
  type InsertBotGuild,
  type BotStats,
  type InsertBotStats,
  type ChatMessage,
  type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // Bot Sessions
  getBotSession(botId: string): Promise<BotSession | undefined>;
  createBotSession(session: InsertBotSession): Promise<BotSession>;
  updateBotSession(botId: string, updates: Partial<BotSession>): Promise<BotSession | undefined>;
  deleteBotSession(botId: string): Promise<boolean>;
  
  // Bot Messages
  createBotMessage(message: InsertBotMessage): Promise<BotMessage>;
  getBotMessages(botId: string, limit?: number): Promise<BotMessage[]>;
  
  // Bot Guilds
  createBotGuild(guild: InsertBotGuild): Promise<BotGuild>;
  getBotGuilds(botId: string): Promise<BotGuild[]>;
  updateBotGuild(botId: string, guildId: string, updates: Partial<BotGuild>): Promise<BotGuild | undefined>;
  deleteBotGuild(botId: string, guildId: string): Promise<boolean>;
  
  // Bot Stats
  createBotStats(stats: InsertBotStats): Promise<BotStats>;
  getLatestBotStats(botId: string): Promise<BotStats | undefined>;
  
  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(botId: string, limit?: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private botSessions: Map<string, BotSession> = new Map();
  private botMessages: BotMessage[] = [];
  private botGuilds: Map<string, BotGuild[]> = new Map();
  private botStats: Map<string, BotStats> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();
  private currentId = 1;

  // Bot Sessions
  async getBotSession(botId: string): Promise<BotSession | undefined> {
    return this.botSessions.get(botId);
  }

  async createBotSession(session: InsertBotSession): Promise<BotSession> {
    const botSession: BotSession = {
      ...session,
      id: this.currentId++,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    this.botSessions.set(session.botId, botSession);
    return botSession;
  }

  async updateBotSession(botId: string, updates: Partial<BotSession>): Promise<BotSession | undefined> {
    const existing = this.botSessions.get(botId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, lastActiveAt: new Date() };
    this.botSessions.set(botId, updated);
    return updated;
  }

  async deleteBotSession(botId: string): Promise<boolean> {
    return this.botSessions.delete(botId);
  }

  // Bot Messages
  async createBotMessage(message: InsertBotMessage): Promise<BotMessage> {
    const botMessage: BotMessage = {
      ...message,
      id: this.currentId++,
      sentAt: new Date(),
    };
    this.botMessages.push(botMessage);
    return botMessage;
  }

  async getBotMessages(botId: string, limit = 50): Promise<BotMessage[]> {
    return this.botMessages
      .filter(msg => msg.botId === botId)
      .sort((a, b) => b.sentAt!.getTime() - a.sentAt!.getTime())
      .slice(0, limit);
  }

  // Bot Guilds
  async createBotGuild(guild: InsertBotGuild): Promise<BotGuild> {
    const botGuild: BotGuild = {
      ...guild,
      id: this.currentId++,
      joinedAt: new Date(),
    };
    
    const existing = this.botGuilds.get(guild.botId) || [];
    existing.push(botGuild);
    this.botGuilds.set(guild.botId, existing);
    return botGuild;
  }

  async getBotGuilds(botId: string): Promise<BotGuild[]> {
    return this.botGuilds.get(botId) || [];
  }

  async updateBotGuild(botId: string, guildId: string, updates: Partial<BotGuild>): Promise<BotGuild | undefined> {
    const guilds = this.botGuilds.get(botId) || [];
    const index = guilds.findIndex(g => g.guildId === guildId);
    if (index === -1) return undefined;
    
    guilds[index] = { ...guilds[index], ...updates };
    this.botGuilds.set(botId, guilds);
    return guilds[index];
  }

  async deleteBotGuild(botId: string, guildId: string): Promise<boolean> {
    const guilds = this.botGuilds.get(botId) || [];
    const filtered = guilds.filter(g => g.guildId !== guildId);
    this.botGuilds.set(botId, filtered);
    return filtered.length < guilds.length;
  }

  // Bot Stats
  async createBotStats(stats: InsertBotStats): Promise<BotStats> {
    const botStats: BotStats = {
      ...stats,
      id: this.currentId++,
      recordedAt: new Date(),
    };
    this.botStats.set(stats.botId, botStats);
    return botStats;
  }

  async getLatestBotStats(botId: string): Promise<BotStats | undefined> {
    return this.botStats.get(botId);
  }

  // Chat Messages
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const chatMessage: ChatMessage = {
      ...message,
      id: this.currentId++,
      timestamp: new Date(),
    };
    
    const existing = this.chatMessages.get(message.botId) || [];
    existing.push(chatMessage);
    this.chatMessages.set(message.botId, existing);
    return chatMessage;
  }

  async getChatMessages(botId: string, limit = 50): Promise<ChatMessage[]> {
    const messages = this.chatMessages.get(botId) || [];
    return messages
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit)
      .reverse();
  }
}

export const storage = new MemStorage();
