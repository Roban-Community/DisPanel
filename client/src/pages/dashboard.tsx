import { useDiscordBot } from "@/hooks/use-discord-bot";
import { useWebSocket } from "@/hooks/use-websocket";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { BotInfo } from "@/components/dashboard/bot-info";
import { CustomStatus } from "@/components/dashboard/custom-status";

export default function DashboardPage() {
  const { botId } = useDiscordBot();
  
  // Initialize WebSocket connection
  useWebSocket(botId);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Dashboard"
        description="Monitor and manage your Discord bot from this central hub"
      />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Bot info and stats overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <BotInfo />
            </div>
            <div className="lg:col-span-2">
              <StatsCards />
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="bg-card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a 
                href="/messages" 
                className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="w-8 h-8 bg-discord-blurple rounded-lg flex items-center justify-center mb-2">
                  <span className="text-white text-sm">✉️</span>
                </div>
                <span className="text-sm font-medium">Send Message</span>
              </a>
              
              <a 
                href="/guilds" 
                className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="w-8 h-8 bg-discord-blurple rounded-lg flex items-center justify-center mb-2">
                  <span className="text-white text-sm">🏰</span>
                </div>
                <span className="text-sm font-medium">Manage Guilds</span>
              </a>
              
              <a 
                href="/chat" 
                className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="w-8 h-8 bg-discord-blurple rounded-lg flex items-center justify-center mb-2">
                  <span className="text-white text-sm">💬</span>
                </div>
                <span className="text-sm font-medium">Live Chat</span>
              </a>
              
              <a 
                href="/console" 
                className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="w-8 h-8 bg-discord-blurple rounded-lg flex items-center justify-center mb-2">
                  <span className="text-white text-sm">⚙️</span>
                </div>
                <span className="text-sm font-medium">Bot Console</span>
              </a>
            </div>
          </div>

          {/* Custom Status */}
          <CustomStatus />
        </div>
      </div>
    </div>
  );
}
