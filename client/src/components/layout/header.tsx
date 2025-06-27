import { useDiscordBot } from "@/hooks/use-discord-bot";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStatusEmoji } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { updateStatus, disconnect, botSession } = useDiscordBot();
  const { toast } = useToast();

  const handleStatusChange = async (status: "online" | "idle" | "dnd" | "invisible") => {
    try {
      await updateStatus.mutateAsync(status);
      toast({
        title: "Status Updated",
        description: `Bot status changed to ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      toast({
        title: "Disconnected",
        description: "Bot has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Bot Status Control */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <Select onValueChange={handleStatusChange} defaultValue="online">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  {getStatusEmoji("online")} Online
                </SelectItem>
                <SelectItem value="idle">
                  {getStatusEmoji("idle")} Idle
                </SelectItem>
                <SelectItem value="dnd">
                  {getStatusEmoji("dnd")} Do Not Disturb
                </SelectItem>
                <SelectItem value="invisible">
                  {getStatusEmoji("invisible")} Invisible
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="ghost"
            onClick={handleDisconnect}
            disabled={disconnect.isPending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut size={16} className="mr-2" />
            Disconnect
          </Button>
        </div>
      </div>
    </header>
  );
}
