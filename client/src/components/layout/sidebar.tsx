import { Link, useLocation } from "wouter";
import { useDiscordBot } from "@/hooks/use-discord-bot";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  BarChart3, 
  MessageSquare, 
  Server, 
  MessageCircle, 
  Terminal,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Guilds", href: "/guilds", icon: Server },
  { name: "Live Chat", href: "/chat", icon: MessageCircle },
  { name: "Console", href: "/console", icon: Terminal },
];

export function Sidebar() {
  const [location] = useLocation();
  const { botSession } = useDiscordBot();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-discord-blurple rounded-full flex items-center justify-center">
            <Bot className="text-white" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">DisPanel</h1>
            <p className="text-sm text-muted-foreground truncate">
              {botSession?.botUsername || "Bot"}#{botSession?.botDiscriminator || "0000"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-discord-blurple text-white"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Theme</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
