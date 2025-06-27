import { useDiscordBot } from "@/hooks/use-discord-bot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { formatDate, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function BotInfo() {
  const { botSession, stats } = useDiscordBot();
  const { toast } = useToast();

  const handleCopyId = async () => {
    if (botSession?.botId) {
      try {
        await copyToClipboard(botSession.botId);
        toast({
          title: "Copied",
          description: "Bot ID copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  if (!botSession) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bot Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bot ID</label>
              <div className="flex items-center space-x-2">
                <code className="px-3 py-2 bg-muted rounded-lg text-sm flex-1 font-mono">
                  {botSession.botId}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyId}
                  className="shrink-0"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bot Username</label>
              <p className="px-3 py-2 bg-muted rounded-lg text-sm">
                {botSession.botUsername}#{botSession.botDiscriminator}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Created</label>
              <p className="px-3 py-2 bg-muted rounded-lg text-sm">
                {formatDate(botSession.createdAt || new Date())}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="bg-discord-blurple">
                  Active
                </Badge>
                <Badge variant="secondary" className="bg-discord-green/10 text-discord-green">
                  Connected
                </Badge>
                {stats.data?.stats?.userCount && (
                  <Badge variant="outline">
                    {stats.data.stats.userCount} users
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
