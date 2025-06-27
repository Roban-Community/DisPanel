import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { BotSession, BotStats, BotMessage, BotGuild, ChatMessage } from "@shared/schema";

interface AuthResponse {
  success: boolean;
  bot?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    createdAt: Date;
  };
  error?: string;
}

interface SessionResponse {
  botId: string;
  session: BotSession;
}

export function useDiscordBot() {
  const queryClient = useQueryClient();

  // Authentication
  const authenticateBot = useMutation({
    mutationFn: async (token: string): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/bot", { token });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  // Session check
  const session = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        return null;
      }
    },
  });

  // Disconnect
  const disconnect = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  // Update status
  const updateStatus = useMutation({
    mutationFn: async (status: "online" | "idle" | "dnd" | "invisible") => {
      const res = await apiRequest("POST", "/api/bot/status", { status });
      return res.json();
    },
  });

  // Bot stats
  const stats = useQuery<{ stats: BotStats | null }>({
    queryKey: ["/api/bot/stats"],
    enabled: !!session.data?.botId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (data: {
      targetType: "channel" | "user";
      targetId: string;
      content: string;
    }) => {
      const res = await apiRequest("POST", "/api/bot/message", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/messages"] });
    },
  });

  // Recent messages
  const messages = useQuery<{ messages: BotMessage[] }>({
    queryKey: ["/api/bot/messages"],
    enabled: !!session.data?.botId,
  });

  // Guilds
  const guilds = useQuery<{ guilds: BotGuild[] }>({
    queryKey: ["/api/bot/guilds"],
    enabled: !!session.data?.botId,
  });

  // Refresh guilds
  const refreshGuilds = useMutation({
    mutationFn: async () => {
      // Just invalidate the cache to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/bot/guilds"] });
      return { success: true };
    },
  });

  // Generate invite
  const generateInvite = useMutation({
    mutationFn: async (guildId: string) => {
      const res = await apiRequest("POST", `/api/bot/guilds/${guildId}/invite`);
      return res.json();
    },
  });

  // Leave guild
  const leaveGuild = useMutation({
    mutationFn: async (guildId: string) => {
      const res = await apiRequest("POST", `/api/bot/guilds/${guildId}/leave`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/guilds"] });
    },
  });

  // Chat messages
  const chatMessages = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ["/api/bot/chat"],
    enabled: !!session.data?.botId,
  });

  // Send chat message
  const sendChatMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/bot/chat", { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/chat"] });
    },
  });

  return {
    // Authentication
    authenticateBot,
    session,
    disconnect,
    updateStatus,
    
    // Bot data
    stats,
    messages,
    guilds,
    chatMessages,
    
    // Actions
    sendMessage,
    refreshGuilds,
    generateInvite,
    leaveGuild,
    sendChatMessage,
    
    // Computed states
    isAuthenticated: !!session.data?.botId,
    isLoading: session.isLoading,
    botId: session.data?.botId,
    botSession: session.data?.session,
  };
}
