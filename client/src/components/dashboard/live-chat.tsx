import { useState, useEffect, useRef } from "react";
import { useDiscordBot } from "@/hooks/use-discord-bot";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function LiveChat() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { chatMessages, sendChatMessage, botId } = useDiscordBot();
  const { isConnected } = useWebSocket(botId);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages.data?.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      await sendChatMessage.mutateAsync(message.trim());
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Live Chat Interface</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-discord-green' : 'bg-destructive'}`} />
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-thin space-y-3">
          {chatMessages.data?.messages.length ? (
            chatMessages.data.messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  msg.isFromBot ? 'bg-discord-green' : 'bg-discord-blurple'
                }`}>
                  {msg.isFromBot ? 'B' : 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`font-medium text-sm ${
                      msg.isFromBot ? 'text-discord-green' : 'text-foreground'
                    }`}>
                      {msg.isFromBot ? 'Bot' : msg.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.timestamp || new Date())}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No messages yet</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-border">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <Input
              placeholder="Send a test message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!isConnected || !message.trim() || sendChatMessage.isPending}
              className="bg-discord-blurple hover:bg-discord-blurple-dark"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
