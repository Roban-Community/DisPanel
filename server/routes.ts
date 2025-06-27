import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { discordService } from "./services/discord";
import { insertBotSessionSchema, insertBotMessageSchema } from "@shared/schema";
import { z } from "zod";

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    botId?: string;
  }
}

interface AuthenticatedWebSocket extends WebSocket {
  botId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients: Map<string, AuthenticatedWebSocket[]> = new Map();

  // Bot Authentication
  app.post("/api/auth/bot", async (req, res) => {
    try {
      const { token } = z.object({ token: z.string() }).parse(req.body);
      
      const result = await discordService.authenticateBot(token);
      
      if (result.success) {
        // Store bot ID in session
        req.session = req.session || {};
        (req.session as any).botId = result.bot?.id;
        
        res.json({
          success: true,
          bot: result.bot,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || "Invalid request",
      });
    }
  });

  // Get current bot session
  app.get("/api/auth/session", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const session = await storage.getBotSession(botId);
    if (!session || !session.isActive) {
      return res.status(401).json({ error: "Bot session not found or inactive" });
    }

    res.json({ botId, session });
  });

  // Disconnect bot
  app.post("/api/auth/disconnect", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const success = await discordService.disconnectBot(botId);
    if (success) {
      delete (req.session as any).botId;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Failed to disconnect bot" });
    }
  });

  // Update bot status
  app.post("/api/bot/status", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { status } = z.object({
        status: z.enum(["online", "idle", "dnd", "invisible"]),
      }).parse(req.body);

      const success = await discordService.updateBotStatus(botId, status);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get bot stats
  app.get("/api/bot/stats", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const stats = await storage.getLatestBotStats(botId);
    res.json({ stats });
  });

  // Send message
  app.post("/api/bot/message", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { targetType, targetId, content } = z.object({
        targetType: z.enum(["channel", "user"]),
        targetId: z.string(),
        content: z.string(),
      }).parse(req.body);

      const result = await discordService.sendMessage(botId, targetType, targetId, content);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get recent messages
  app.get("/api/bot/messages", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const messages = await storage.getBotMessages(botId, 10);
    res.json({ messages });
  });

  // Get guilds
  app.get("/api/bot/guilds", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const guilds = await storage.getBotGuilds(botId);
    res.json({ guilds: guilds.filter(g => g.isActive) });
  });

  // Generate invite
  app.post("/api/bot/guilds/:guildId/invite", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { guildId } = req.params;
    const result = await discordService.generateInvite(botId, guildId);
    res.json(result);
  });

  // Leave guild
  app.post("/api/bot/guilds/:guildId/leave", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { guildId } = req.params;
    const result = await discordService.leaveGuild(botId, guildId);
    res.json(result);
  });

  // Get chat messages
  app.get("/api/bot/chat", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const messages = await storage.getChatMessages(botId);
    res.json({ messages });
  });

  // Send chat message (for testing)
  app.post("/api/bot/chat", async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { content } = z.object({
        content: z.string(),
      }).parse(req.body);

      const message = await storage.createChatMessage({
        botId,
        userId: "test-user",
        username: "Test User",
        content,
        isFromBot: false,
      });

      // Broadcast to connected clients
      broadcastToBotClients(botId, {
        type: "chat_message",
        data: message,
      });

      res.json({ success: true, message });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get guild channels
  app.get('/api/bot/guilds/:guildId/channels', async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { guildId } = req.params;
      const result = await discordService.getGuildChannels(botId, guildId);
      
      if (result.success) {
        res.json({ success: true, channels: result.channels });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Get guild channels error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get channel messages
  app.get('/api/bot/channels/:channelId/messages', async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { channelId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await discordService.getChannelMessages(botId, channelId, limit);
      
      if (result.success) {
        res.json({ success: true, messages: result.messages });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Get channel messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update custom status
  app.post('/api/bot/custom-status', async (req, res) => {
    const botId = (req.session as any)?.botId;
    if (!botId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { text, type } = z.object({
        text: z.string().min(1).max(128),
        type: z.enum(['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'])
      }).parse(req.body);

      const result = await discordService.updateCustomStatus(botId, text, type);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Update custom status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          ws.botId = message.botId;
          
          // Add to connected clients
          if (!connectedClients.has(message.botId)) {
            connectedClients.set(message.botId, []);
          }
          connectedClients.get(message.botId)!.push(ws);
          
          ws.send(JSON.stringify({
            type: 'auth_success',
            botId: message.botId,
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove from connected clients
      if (ws.botId) {
        const clients = connectedClients.get(ws.botId) || [];
        const index = clients.indexOf(ws);
        if (index > -1) {
          clients.splice(index, 1);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function broadcastToBotClients(botId: string, message: any) {
    const clients = connectedClients.get(botId) || [];
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Set up periodic stats broadcasting
  setInterval(async () => {
    for (const [botId, clients] of connectedClients) {
      if (clients.length > 0) {
        const stats = await storage.getLatestBotStats(botId);
        if (stats) {
          broadcastToBotClients(botId, {
            type: 'stats_update',
            data: stats,
          });
        }
      }
    }
  }, 5000);

  return httpServer;
}
