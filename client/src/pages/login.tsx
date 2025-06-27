import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [rememberToken, setRememberToken] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Please enter a bot token");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(token);
      
      if (result.success) {
        if (rememberToken) {
          localStorage.setItem("discord_bot_token", token);
        }
        
        toast({
          title: "Success!",
          description: `Connected to ${result.bot?.username}`,
        });
        
        // Force page refresh to trigger proper navigation
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(result.error || "Authentication failed");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to bot");
      setIsSubmitting(false);
    }
  };

  // Auto-fill token from localStorage if available
  useState(() => {
    const savedToken = localStorage.getItem("discord_bot_token");
    if (savedToken) {
      setToken(savedToken);
      setRememberToken(true);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-discord-blurple/10 to-discord-pink/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-discord-blurple rounded-full flex items-center justify-center mx-auto">
            <Bot className="text-white text-2xl" size={32} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">DisPanel</CardTitle>
            <CardDescription>Enter your bot token to continue</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token">Bot Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="MTk4NjIyNDgzNDcxOTI1MjQ4.G5N3cI.example_token_here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberToken}
                onCheckedChange={(checked) => setRememberToken(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm">
                Remember token (stored locally)
              </Label>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-discord-blurple hover:bg-discord-blurple-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connecting..." : "Connect Bot"}
            </Button>
          </form>
          
          <Alert className="mt-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-2">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                Security Notice
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Your bot token is processed locally and never sent to third-party servers.
              </p>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
