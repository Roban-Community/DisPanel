import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';

interface CustomStatusProps {
  currentStatus?: {
    text: string;
    type: string;
  };
}

export function CustomStatus({ currentStatus }: CustomStatusProps) {
  const [statusText, setStatusText] = useState(currentStatus?.text || '');
  const [statusType, setStatusType] = useState(currentStatus?.type || 'PLAYING');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ text, type }: { text: string; type: string }) => {
      const response = await fetch('/api/bot/custom-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text,
          type,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Your bot's custom status has been updated successfully",
      });
      
      // Refresh bot stats to show updated status
      queryClient.invalidateQueries({ queryKey: ['/api/bot/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!statusText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a status text",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      text: statusText,
      type: statusType,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          Custom Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status-type">Activity Type</Label>
            <Select value={statusType} onValueChange={setStatusType}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLAYING">🎮 Playing</SelectItem>
                <SelectItem value="STREAMING">📺 Streaming</SelectItem>
                <SelectItem value="LISTENING">🎵 Listening to</SelectItem>
                <SelectItem value="WATCHING">👀 Watching</SelectItem>
                <SelectItem value="COMPETING">🏆 Competing in</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status-text">Status Text</Label>
            <Input
              id="status-text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Enter your custom status..."
              maxLength={128}
            />
            <p className="text-xs text-muted-foreground">
              {statusText.length}/128 characters
            </p>
          </div>

          {currentStatus && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current Status:</p>
              <p className="text-sm font-medium">
                {currentStatus.type === 'PLAYING' && '🎮'} 
                {currentStatus.type === 'STREAMING' && '📺'} 
                {currentStatus.type === 'LISTENING' && '🎵'} 
                {currentStatus.type === 'WATCHING' && '👀'} 
                {currentStatus.type === 'COMPETING' && '🏆'} 
                {currentStatus.type.charAt(0) + currentStatus.type.slice(1).toLowerCase()} {currentStatus.text}
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={updateStatusMutation.isPending}
            className="w-full"
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Status
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}