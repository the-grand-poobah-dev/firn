'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';

export function NotificationsButton({ initialUnread, userId: initialUserId }: { initialUnread: boolean; userId?: string }) {
  const [unread, setUnread] = useState(initialUnread);
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/notifications/unread', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        if (active) { setUnread(Number(payload.unread) > 0); if (typeof payload.userId === 'string') setUserId(payload.userId); }
      } catch { /* Keep the last known badge state during temporary network errors. */ }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, []);
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase.channel(`notifications-badge:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, async () => {
        try { const response = await fetch('/api/notifications/unread', { cache: 'no-store' }); if (response.ok) { const payload = await response.json(); setUnread(Number(payload.unread) > 0); } } catch { /* Keep the last known badge state. */ }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);
  return <Link href="/home/notifications" aria-label={unread ? 'Notifications, unread items' : 'Notifications'} className="relative grid size-10 place-items-center rounded-full border border-line bg-card text-fg">
    <Icon name="bell" size={19}/>
    {unread && <span aria-label="Unread notifications" className="absolute right-2 top-2 size-2 rounded-full bg-neg ring-2 ring-card"/>}
  </Link>;
}
