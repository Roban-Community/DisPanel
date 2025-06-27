import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useDiscordBot } from "@/hooks/use-discord-bot";

interface ConsoleMessage {
  id: string;
  type: 'info' | 'warn' | 'error' | 'debug' | 'command' | 'result';
  message: string;
  timestamp: Date;
}

export function Console() {
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    {
      id: '1',
      type: 'info',
      message: 'Bot started successfully',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      type: 'info',
      message: 'Connected to Discord Gateway',
      timestamp: new Date(Date.now() - 50000),
    },
    {
      id: '3',
      type: 'debug',
      message: 'Guild cache updated',
      timestamp: new Date(Date.now() - 30000),
    },
    {
      id: '4',
      type: 'info',
      message: 'Ready to serve users - Run help for a list of commands.',
      timestamp: new Date(Date.now() - 10000),
    },
  ]);
  
  const [command, setCommand] = useState("");
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const { botId } = useDiscordBot();

  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: ConsoleMessage['type'], message: string) => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;

    // Add the command to console
    addMessage('command', `> ${command}`);

    // Simple command handling (this would normally be sent to the backend)
    const cmd = command.toLowerCase().trim();
    
    setTimeout(() => {
      switch (cmd) {
        case 'help':
          addMessage('result', 'Available commands: help, status, guilds, clear, ping');
          break;
        case 'status':
          addMessage('result', botId ? `Bot ID: ${botId} - Status: Online` : 'No bot connected');
          break;
        case 'guilds':
          addMessage('result', 'Use the Guilds tab to view and manage guilds');
          break;
        case 'ping':
          addMessage('result', 'Pong! Check the dashboard for actual ping stats');
          break;
        case 'clear':
          setMessages([]);
          break;
        default:
          addMessage('error', `Unknown command: ${cmd}. Type 'help' for available commands.`);
      }
    }, 100);

    setCommand("");
  };

  const clearConsole = () => {
    setMessages([]);
  };

  const getMessageColor = (type: ConsoleMessage['type']): string => {
    switch (type) {
      case 'info':
        return 'text-green-400';
      case 'warn':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'debug':
        return 'text-blue-400';
      case 'command':
        return 'text-cyan-400';
      case 'result':
        return 'text-white';
      default:
        return 'text-gray-300';
    }
  };

  const getMessagePrefix = (type: ConsoleMessage['type']): string => {
    switch (type) {
      case 'info':
        return '[INFO]';
      case 'warn':
        return '[WARN]';
      case 'error':
        return '[ERROR]';
      case 'debug':
        return '[DEBUG]';
      case 'command':
        return '';
      case 'result':
        return '';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bot Console</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConsole}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 size={16} className="mr-2" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-gray-900 text-green-400 font-mono text-sm h-64 overflow-y-auto scrollbar-thin">
          <div className="p-4 space-y-1">
            {messages.map((msg) => (
              <div key={msg.id} className={`${getMessageColor(msg.type)} flex items-start space-x-2`}>
                <span className="text-xs text-gray-500 shrink-0 w-16">
                  {msg.timestamp.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
                <span className="shrink-0 w-16 text-xs">
                  {getMessagePrefix(msg.type)}
                </span>
                <span className="break-all">{msg.message}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t border-border bg-gray-900">
          <form onSubmit={handleCommand} className="flex items-center space-x-2">
            <span className="text-blue-400 font-mono text-sm shrink-0">bot&gt;</span>
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command..."
              className="bg-transparent border-none text-green-400 font-mono text-sm focus:ring-0 focus:border-none"
            />
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
