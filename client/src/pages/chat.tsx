import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatTime, generateGuildIconFallback } from '@/lib/utils';
import { Hash, Users, Send, Settings, AtSign, Volume2, VolumeX } from 'lucide-react';

interface Guild {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  memberCount: number | null;
  permissions: string | null;
}

interface Channel {
  id: string;
  name: string;
  type: number;
  position: number;
  parentId?: string;
}

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
    bot: boolean;
  };
  timestamp: string;
  channelId: string;
  guildId?: string;
}

export default function ChatPage() {
  const { isAuthenticated, botId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage: sendWebSocketMessage } = useWebSocket(botId || undefined);
  
  const [selectedGuild, setSelectedGuild] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch guilds
  const { data: guildsData } = useQuery({
    queryKey: ['/api/bot/guilds'],
    enabled: !!botId,
  });

  const guilds: Guild[] = (guildsData as any)?.guilds || [];

  // Fetch channels for selected guild
  useEffect(() => {
    if (!selectedGuild) {
      setChannels([]);
      setSelectedChannel('');
      return;
    }

    setIsLoadingChannels(true);
    fetch(`/api/bot/guilds/${selectedGuild}/channels`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setChannels(data.channels || []);
        } else {
          toast({
            title: "Error",
            description: "Failed to load channels",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load channels",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoadingChannels(false);
      });
  }, [selectedGuild, toast]);

  // Fetch messages for selected channel
  useEffect(() => {
    if (!selectedChannel) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    fetch(`/api/bot/channels/${selectedChannel}/messages`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMessages(data.messages || []);
        } else {
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [selectedChannel, toast]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, channelId }: { content: string; channelId: string }) => {
      const response = await fetch('/api/bot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetType: 'channel',
          targetId: channelId,
          content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setMessageContent('');
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
      
      // Refresh messages after sending
      setTimeout(() => {
        if (selectedChannel) {
          setIsLoadingMessages(true);
          fetch(`/api/bot/channels/${selectedChannel}/messages`, {
            credentials: 'include',
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                setMessages(data.messages || []);
              }
            })
            .finally(() => {
              setIsLoadingMessages(false);
            });
        }
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageContent.trim()) return;
    if (!selectedChannel) {
      toast({
        title: "Error",
        description: "Please select a channel first",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      content: messageContent,
      channelId: selectedChannel,
    });
  };

  const selectedGuildData = guilds.find(g => g.guildId === selectedGuild);
  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  // Group channels by category
  const textChannels = channels.filter(c => c.type === 0).sort((a, b) => a.position - b.position);
  const voiceChannels = channels.filter(c => c.type === 2).sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-[#36393f]">
      <Header
        title="Live Chat"
        description="Chat with your Discord communities in real-time"
      />
      
      <div className="flex h-[calc(100vh-80px)]">
        {/* Server & Channel Sidebar */}
        <div className="w-80 bg-[#2f3136] border-r border-[#202225] flex flex-col">
          {/* Server Selection */}
          <div className="p-4 border-b border-[#202225]">
            <Select value={selectedGuild} onValueChange={setSelectedGuild}>
              <SelectTrigger className="bg-[#40444b] border-[#202225] text-white">
                <SelectValue placeholder="Select a server..." />
              </SelectTrigger>
              <SelectContent className="bg-[#40444b] border-[#202225] text-white">
                {guilds.map((guild) => (
                  <SelectItem key={guild.guildId} value={guild.guildId}>
                    <div className="flex items-center gap-2">
                      {guild.guildIcon ? (
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={`https://cdn.discordapp.com/icons/${guild.guildId}/${guild.guildIcon}.png`} />
                          <AvatarFallback className="text-xs bg-[#5865f2] text-white">
                            {generateGuildIconFallback(guild.guildName)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#5865f2] flex items-center justify-center text-xs text-white font-medium">
                          {generateGuildIconFallback(guild.guildName)}
                        </div>
                      )}
                      <span className="truncate">{guild.guildName}</span>
                      {guild.memberCount && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {guild.memberCount}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2">
                {selectedGuild ? (
                  isLoadingChannels ? (
                    <div className="text-center text-[#b9bbbe] py-8">Loading channels...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Text Channels */}
                      {textChannels.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
                            <Hash className="w-3 h-3" />
                            Text Channels
                          </div>
                          <div className="space-y-0.5">
                            {textChannels.map((channel) => (
                              <button
                                key={channel.id}
                                onClick={() => setSelectedChannel(channel.id)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                                  selectedChannel === channel.id
                                    ? 'bg-[#393c43] text-white'
                                    : 'text-[#8e9297] hover:text-[#dcddde] hover:bg-[#34373c]'
                                }`}
                              >
                                <Hash className="w-4 h-4 text-[#8e9297]" />
                                <span className="truncate">{channel.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Voice Channels */}
                      {voiceChannels.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#8e9297] uppercase tracking-wide">
                            <Volume2 className="w-3 h-3" />
                            Voice Channels
                          </div>
                          <div className="space-y-0.5">
                            {voiceChannels.map((channel) => (
                              <div
                                key={channel.id}
                                className="flex items-center gap-2 px-2 py-1.5 text-sm text-[#8e9297]"
                              >
                                <Volume2 className="w-4 h-4 text-[#8e9297]" />
                                <span className="truncate">{channel.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {textChannels.length === 0 && voiceChannels.length === 0 && (
                        <div className="text-center text-[#8e9297] py-8">
                          No channels available
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center text-[#8e9297] py-8">
                    Select a server to view channels
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Channel Header */}
          {selectedChannelData && selectedGuildData && (
            <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4">
              <Hash className="w-5 h-5 text-[#8e9297] mr-2" />
              <span className="font-semibold text-white">{selectedChannelData.name}</span>
              <Separator orientation="vertical" className="mx-4 h-6 bg-[#40444b]" />
              <span className="text-sm text-[#b9bbbe]">
                {selectedGuildData.guildName}
              </span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                {selectedChannel ? (
                  isLoadingMessages ? (
                    <div className="text-center text-[#b9bbbe] py-8">Loading messages...</div>
                  ) : (
                    <div className="space-y-4">
                      {messages.length > 0 ? (
                        messages.map((message, index) => {
                          const showAvatar = index === 0 || messages[index - 1]?.author.id !== message.author.id;
                          const isBot = message.author.bot;
                          
                          return (
                            <div key={message.id} className={`flex gap-3 ${showAvatar ? '' : 'ml-12'}`}>
                              {showAvatar && (
                                <Avatar className="w-8 h-8 mt-0.5">
                                  <AvatarImage 
                                    src={message.author.avatar 
                                      ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
                                      : undefined
                                    } 
                                  />
                                  <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                                    {message.author.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1 min-w-0">
                                {showAvatar && (
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-white">
                                      {message.author.username}
                                    </span>
                                    {isBot && (
                                      <Badge variant="secondary" className="text-xs bg-[#5865f2] text-white">
                                        BOT
                                      </Badge>
                                    )}
                                    <span className="text-xs text-[#72767d]">
                                      {formatTime(message.timestamp)}
                                    </span>
                                  </div>
                                )}
                                <div className="text-[#dcddde] break-words">
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-[#8e9297] py-8">
                          No messages in this channel yet
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )
                ) : (
                  <div className="text-center text-[#8e9297] py-8">
                    Select a channel to view messages
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Message Input */}
          {selectedChannel && (
            <div className="p-4 bg-[#36393f] border-t border-[#202225]">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={`Message #${selectedChannelData?.name || 'channel'}`}
                    className="min-h-[44px] max-h-32 bg-[#40444b] border-[#202225] text-white placeholder:text-[#72767d] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-11"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}