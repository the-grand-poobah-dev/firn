import { requireUser } from '@/lib/auth';
import { NotificationsList } from '@/components/home/NotificationsList';
import { TopBar } from '@/components/app/TopBar';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  await requireUser();
  return <div className="space-y-5"><TopBar title="Notifications" backHref="/home"/><NotificationsList/></div>;
}
