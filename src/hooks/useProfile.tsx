import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicProfile {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  university: string | null;
  username: string | null;
  verification_status: string;
  last_active_at: string | null;
  created_at: string;
}

/**
 * Fetch a single user's public profile from Supabase by their user ID.
 */
export function useProfileById(userId: string | null | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) {
            console.warn('Failed to fetch profile:', error.message);
          }
          setProfile(data as PublicProfile | null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  return { profile, loading };
}

/**
 * Fetch multiple profiles at once (e.g. for message senders/receivers).
 * Returns a Map of userId -> PublicProfile.
 */
export function useProfilesByIds(userIds: string[]) {
  const [profiles, setProfiles] = useState<Map<string, PublicProfile>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      setProfiles(new Map());
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('profiles')
      .select('*')
      .in('id', uniqueIds)
      .then(({ data }) => {
        if (!cancelled) {
          const map = new Map<string, PublicProfile>();
          (data || []).forEach((p: PublicProfile) => map.set(p.id, p));
          setProfiles(map);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [userIds.join(',')]);

  return { profiles, loading };
}
