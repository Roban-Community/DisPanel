import { Client, GatewayIntentBits, Events, ActivityType, PresenceStatusData } from 'discord.js';
import { storage } from '../storage';
import type { InsertBotStats, InsertBotGuild, InsertChatMessage } from '@shared/schema';

export class DiscordBotService {
  private clients: Map<string, Client> = new Map();
  private statsIntervals: Map<string, NodeJS.Timeout> = new Map();

  async authenticateBot(token: string): Promise<{ success: boolean; bot?: any; error?: string }> {
    try {
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      await client.login(token);
      
      const botUser = client.user!;
      const botId = botUser.id;

      // Store bot session
      await storage.createBotSession({
        botId,
        botToken: token,
        botUsername: botUser.username,
        botDiscriminator: botUser.discriminator || '0000',
        isActive: true,
      });

      // Store client
      this.clients.set(botId, client);

      // Set up event listeners
      this.setupEventListeners(client, botId);

      // Start stats collection
      this.startStatsCollection(client, botId);

      // Sync guilds
      await this.syncGuilds(client, botId);

      return {
        success: true,
        bot: {
          id: botId,
          username: botUser.username,
          discriminator: botUser.discriminator,
          avatar: botUser.avatar,
          createdAt: botUser.createdAt,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to authenticate bot',
      };
    }
  }

  async disconnectBot(botId: string): Promise<boolean> {
    const client = this.clients.get(botId);
    if (client) {
      client.destroy();
      this.clients.delete(botId);
      
      const interval = this.statsIntervals.get(botId);
      if (interval) {
        clearInterval(interval);
        this.statsIntervals.delete(botId);
      }

      await storage.updateBotSession(botId, { isActive: false });
      return true;
    }
    return false;
  }

  async updateBotStatus(botId: string, status: PresenceStatusData): Promise<boolean> {
    const client = this.clients.get(botId);
    if (!client) return false;

    try {
      await client.user?.setPresence({
        status,
        activities: [],
      });

      await storage.updateBotSession(botId, { lastActiveAt: new Date() });
      return true;
    } catch (error) {
      console.error('Failed to update bot status:', error);
      return false;
    }
  }

  async sendMessage(botId: string, targetType: 'channel' | 'user', targetId: string, content: string): Promise<{ success: boolean; error?: string }> {
    const client = this.clients.get(botId);
    if (!client) return { success: false, error: 'Bot not connected' };

    try {
      let target;
      if (targetType === 'channel') {
        target = await client.channels.fetch(targetId);
      } else {
        target = await client.users.fetch(targetId);
      }

      if (!target) {
        return { success: false, error: 'Target not found' };
      }

      if ('send' in target) {
        await target.send(content);
      } else {
        return { success: false, error: 'Cannot send message to this target' };
      }

      // Store message record
      await storage.createBotMessage({
        botId,
        targetType,
        targetId,
        content,
        success: true,
      });

      return { success: true };
    } catch (error: any) {
      // Store failed message record
      await storage.createBotMessage({
        botId,
        targetType,
        targetId,
        content,
        success: false,
        errorMessage: error.message,
      });

      return { success: false, error: error.message };
    }
  }

  async generateInvite(botId: string, guildId: string, permissions?: string): Promise<{ success: boolean; inviteUrl?: string; error?: string }> {
    const client = this.clients.get(botId);
    if (!client) return { success: false, error: 'Bot not connected' };

    try {
      const guild = await client.guilds.fetch(guildId);
      if (!guild) return { success: false, error: 'Guild not found' };

      const inviteUrl = client.generateInvite({
        scopes: ['bot'],
        permissions: permissions ? BigInt(permissions) : undefined,
      });

      return { success: true, inviteUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async leaveGuild(botId: string, guildId: string): Promise<{ success: boolean; error?: string }> {
    const client = this.clients.get(botId);
    if (!client) return { success: false, error: 'Bot not connected' };

    try {
      const guild = await client.guilds.fetch(guildId);
      if (!guild) return { success: false, error: 'Guild not found' };

      await guild.leave();
      await storage.updateBotGuild(botId, guildId, { isActive: false });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getClient(botId: string): Client | undefined {
    return this.clients.get(botId);
  }

  async getGuildChannels(botId: string, guildId: string): Promise<{ success: boolean; channels?: any[]; error?: string }> {
    try {
      const client = this.clients.get(botId);
      if (!client) {
        return { success: false, error: 'Bot not connected' };
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return { success: false, error: 'Guild not found' };
      }

      const channels = guild.channels.cache
        .filter(channel => channel.type === 0 || channel.type === 2) // Text and voice channels
        .map(channel => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          position: channel.position,
          parentId: channel.parentId,
        }))
        .sort((a, b) => a.position - b.position);

      return { success: true, channels };
    } catch (error: any) {
      console.error('Get guild channels error:', error);
      return { success: false, error: error.message };
    }
  }

  async getChannelMessages(botId: string, channelId: string, limit: number = 50): Promise<{ success: boolean; messages?: any[]; error?: string }> {
    try {
      const client = this.clients.get(botId);
      if (!client) {
        return { success: false, error: 'Bot not connected' };
      }

      const channel = client.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) {
        return { success: false, error: 'Channel not found or not a text channel' };
      }

      const messages = await channel.messages.fetch({ limit });
      
      const formattedMessages = messages
        .map(message => ({
          id: message.id,
          content: message.content,
          author: {
            id: message.author.id,
            username: message.author.username,
            avatar: message.author.avatar,
            bot: message.author.bot,
          },
          timestamp: message.createdAt.toISOString(),
          channelId: message.channelId,
          guildId: message.guildId,
        }))
        .reverse(); // Reverse to show oldest first

      return { success: true, messages: formattedMessages };
    } catch (error: any) {
      console.error('Get channel messages error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCustomStatus(botId: string, text: string, type: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.clients.get(botId);
      if (!client) {
        return { success: false, error: 'Bot not connected' };
      }

      // Map activity types to Discord.js ActivityType enum values
      const activityTypeMap = {
        'PLAYING': 0,
        'STREAMING': 1,
        'LISTENING': 2,
        'WATCHING': 3,
        'COMPETING': 5
      };

      const activityType = activityTypeMap[type as keyof typeof activityTypeMap];
      if (activityType === undefined) {
        return { success: false, error: 'Invalid activity type' };
      }

      await client.user?.setActivity(text, { type: activityType });

      return { success: true };
    } catch (error: any) {
      console.error('Update custom status error:', error);
      return { success: false, error: error.message };
    }
  }

  private setupEventListeners(client: Client, botId: string) {
    client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;

      // Store chat message for live chat interface
      await storage.createChatMessage({
        botId,
        userId: message.author.id,
        username: message.author.username,
        content: message.content,
        isFromBot: false,
      });
    });

    client.on(Events.GuildCreate, async (guild) => {
      await storage.createBotGuild({
        botId,
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.icon,
        memberCount: guild.memberCount,
        permissions: guild.members.me?.permissions.bitfield.toString(),
        isActive: true,
      });
    });

    client.on(Events.GuildDelete, async (guild) => {
      await storage.updateBotGuild(botId, guild.id, { isActive: false });
    });
  }

  private startStatsCollection(client: Client, botId: string) {
    const interval = setInterval(async () => {
      if (!client.isReady()) return;

      const stats: InsertBotStats = {
        botId,
        ping: client.ws.ping,
        uptime: Math.floor(client.uptime! / 1000),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        guildCount: client.guilds.cache.size,
        userCount: client.users.cache.size,
        status: client.user?.presence?.status || 'online',
      };

      await storage.createBotStats(stats);
    }, 30000); // Update every 30 seconds

    this.statsIntervals.set(botId, interval);
  }

  private async syncGuilds(client: Client, botId: string) {
    try {
      const guilds = await client.guilds.fetch();
      
      for (const [guildId, partialGuild] of guilds) {
        const guild = await partialGuild.fetch();
        
        await storage.createBotGuild({
          botId,
          guildId: guild.id,
          guildName: guild.name,
          guildIcon: guild.icon,
          memberCount: guild.memberCount,
          permissions: guild.members.me?.permissions.bitfield.toString(),
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Failed to sync guilds:', error);
    }
  }
}

export const discordService = new DiscordBotService();
