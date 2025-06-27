import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface WebSocketMessage {
  type: string;
  data?: any;
  botId?: string;
}

export function useWebSocket(botId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!botId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Authenticate with bot ID
      ws.send(JSON.stringify({
        type: "auth",
        botId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [botId]);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "auth_success":
        console.log("WebSocket authenticated for bot:", message.botId);
        break;
        
      case "stats_update":
        // Update stats cache
        queryClient.setQueryData(["/api/bot/stats"], {
          stats: message.data,
        });
        break;
        
      case "chat_message":
        // Invalidate chat messages to refetch
        queryClient.invalidateQueries({ queryKey: ["/api/bot/chat"] });
        break;
        
      case "guild_update":
        // Invalidate guilds to refetch
        queryClient.invalidateQueries({ queryKey: ["/api/bot/guilds"] });
        break;
        
      default:
        console.log("Unknown WebSocket message type:", message.type);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    sendMessage,
  };
}
