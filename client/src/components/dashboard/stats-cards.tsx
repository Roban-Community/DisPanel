import { useDiscordBot } from "@/hooks/use-discord-bot";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Wifi, Clock, HardDrive } from "lucide-react";
import { formatUptime, formatMemory } from "@/lib/utils";

export function StatsCards() {
  const { stats } = useDiscordBot();

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const botStats = stats.data?.stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Servers */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Servers</p>
              <p className="text-3xl font-bold text-discord-blurple">
                {botStats?.guildCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-discord-blurple/10 rounded-lg flex items-center justify-center">
              <Server className="text-discord-blurple" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Ping */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ping</p>
              <p className="text-3xl font-bold text-discord-green">
                {botStats?.ping || 0}ms
              </p>
            </div>
            <div className="w-12 h-12 bg-discord-green/10 rounded-lg flex items-center justify-center">
              <Wifi className="text-discord-green" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Uptime */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <p className="text-3xl font-bold text-discord-yellow">
                {botStats?.uptime ? formatUptime(botStats.uptime) : "0m"}
              </p>
            </div>
            <div className="w-12 h-12 bg-discord-yellow/10 rounded-lg flex items-center justify-center">
              <Clock className="text-discord-yellow" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Memory */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Memory</p>
              <p className="text-3xl font-bold text-discord-pink">
                {botStats?.memoryUsage ? formatMemory(botStats.memoryUsage) : "0MB"}
              </p>
            </div>
            <div className="w-12 h-12 bg-discord-pink/10 rounded-lg flex items-center justify-center">
              <HardDrive className="text-discord-pink" size={24} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
