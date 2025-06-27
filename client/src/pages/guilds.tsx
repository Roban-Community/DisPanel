import { Header } from '@/components/layout/header';
import { GuildManagement } from '@/components/dashboard/guild-management';

export default function GuildsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Guild Management"
        description="Manage your bot's server memberships and permissions"
      />
      
      <div className="flex-1 p-6">
        <GuildManagement />
      </div>
    </div>
  );
}