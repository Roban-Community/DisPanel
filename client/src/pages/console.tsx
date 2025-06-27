import { Header } from '@/components/layout/header';
import { Console } from '@/components/dashboard/console';

export default function ConsolePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Bot Console"
        description="Monitor bot activities and execute commands in real-time"
      />
      
      <div className="flex-1 p-6">
        <Console />
      </div>
    </div>
  );
}