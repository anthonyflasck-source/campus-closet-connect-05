import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    const fetchCount = async () => {
      const { count: c, error } = await (supabase
        .from('messages') as any)
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (!error && c !== null) setCount(c);
    };

    fetchCount();

    const channel = supabase
      .channel(`unread-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => fetchCount())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  return count;
}
