import { useState } from "react";
import { useDiscordBot } from "@/hooks/use-discord-bot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function MessagePanel() {
  const [targetType, setTargetType] = useState<"channel" | "user">("channel");
  const [targetId, setTargetId] = useState("");
  const [content, setContent] = useState("");
  
  const { sendMessage, messages } = useDiscordBot();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetId.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await sendMessage.mutateAsync({
        targetType,
        targetId: targetId.trim(),
        content: content.trim(),
      });

      if (result.success) {
        toast({
          title: "Message Sent",
          description: `Message sent to ${targetType}`,
        });
        setContent("");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="targetType">Target Type</Label>
              <Select
                value={targetType}
                onValueChange={(value: "channel" | "user") => setTargetType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="channel">Channel</SelectItem>
                  <SelectItem value="user">Direct Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="targetId">Target ID</Label>
              <Input
                id="targetId"
                placeholder={`Enter ${targetType} ID`}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Type your message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
            <Button 
              type="submit"
              disabled={sendMessage.isPending}
              className="w-full bg-discord-blurple hover:bg-discord-blurple-dark"
            >
              <Send size={16} className="mr-2" />
              {sendMessage.isPending ? "Sending..." : "Send Message"}
            </Button>
          </form>
          
          {/* Recent Messages */}
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Messages</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
              {messages.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : messages.data?.messages.length ? (
                messages.data.messages.map((message) => (
                  <div key={message.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        message.targetType === 'channel' 
                          ? 'text-discord-blurple' 
                          : 'text-discord-green'
                      }`}>
                        {message.targetType === 'channel' ? '#' : '@'}{message.targetId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.sentAt || new Date())}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                    {message.success === false && (
                      <p className="text-xs text-destructive mt-1">
                        Failed: {message.errorMessage}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent messages
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
