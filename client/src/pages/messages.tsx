import { Header } from '@/components/layout/header';
import { MessagePanel } from '@/components/dashboard/message-panel';

export default function MessagesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Send Message"
        description="Send messages to channels and users through your Discord bot"
      />
      
      <div className="flex-1 p-6">
        <MessagePanel />
      </div>
    </div>
  );
}