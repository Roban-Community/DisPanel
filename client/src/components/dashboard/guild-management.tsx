import { useDiscordBot } from "@/hooks/use-discord-bot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, LogOut } from "lucide-react";
import { generateGuildIconFallback } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function GuildManagement() {
  const { guilds, refreshGuilds, generateInvite, leaveGuild } = useDiscordBot();
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      await refreshGuilds.mutateAsync();
      toast({
        title: "Success",
        description: "Guilds refreshed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh guilds",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvite = async (guildId: string, guildName: string) => {
    try {
      const result = await generateInvite.mutateAsync(guildId);
      
      if (result.success && result.inviteUrl) {
        // Copy to clipboard
        await navigator.clipboard.writeText(result.inviteUrl);
        toast({
          title: "Invite Generated",
          description: `Invite URL for ${guildName} copied to clipboard`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate invite",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGuild = async (guildId: string, guildName: string) => {
    if (!confirm(`Are you sure you want to leave ${guildName}?`)) {
      return;
    }

    try {
      const result = await leaveGuild.mutateAsync(guildId);
      
      if (result.success) {
        toast({
          title: "Left Guild",
          description: `Successfully left ${guildName}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to leave guild",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave guild",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Guild Management</CardTitle>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshGuilds.isPending}
            className="bg-discord-blurple hover:bg-discord-blurple-dark text-white border-discord-blurple"
          >
            <RefreshCw 
              size={16} 
              className={`mr-2 ${refreshGuilds.isPending ? 'animate-spin' : ''}`} 
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="mb-3">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            ))
          ) : guilds.data?.guilds.length ? (
            guilds.data.guilds.map((guild) => (
              <div key={guild.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  {guild.guildIcon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${guild.guildId}/${guild.guildIcon}.png`}
                      alt={guild.guildName}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-discord-blurple to-discord-pink rounded-full flex items-center justify-center text-white font-bold">
                      {generateGuildIconFallback(guild.guildName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{guild.guildName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {guild.memberCount ? `${guild.memberCount.toLocaleString()} members` : 'Unknown members'}
                    </p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Guild ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                    {guild.guildId}
                  </code>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateInvite(guild.guildId, guild.guildName)}
                    disabled={generateInvite.isPending}
                    className="flex-1 bg-discord-green hover:bg-green-600 text-white"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    Invite
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleLeaveGuild(guild.guildId, guild.guildName)}
                    disabled={leaveGuild.isPending}
                    className="flex-1"
                  >
                    <LogOut size={14} className="mr-1" />
                    Leave
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No guilds found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
