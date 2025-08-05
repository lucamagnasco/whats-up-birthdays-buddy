import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Group {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_at: string;
  created_by: string;
  member_count?: number;
}

interface UseGroupsReturn {
  groups: Group[];
  loading: boolean;
  error: string | null;
  refreshGroups: () => Promise<void>;
  loadMoreGroups: () => Promise<void>;
  hasMore: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const GROUPS_PER_PAGE = 20;

export const useGroups = (): UseGroupsReturn => {
  const { user, isAnonymous } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchGroups = useCallback(async (page = 0, append = false) => {
    if (!user && !isAnonymous) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `groups_${user?.id || 'anonymous'}_${page}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          if (append) {
            setGroups(prev => [...prev, ...data]);
          } else {
            setGroups(data);
          }
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from("groups")
        .select(`
          *,
          group_members(count)
        `)
        .is("deactivated_at", null)
        .range(page * GROUPS_PER_PAGE, (page + 1) * GROUPS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      // If user is authenticated, filter by their memberships
      if (user) {
        query = query.or(`created_by.eq.${user.id},id.in.(select group_id from group_members where user_id = '${user.id}')`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const groupsWithCounts = data?.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      })) || [];

      // Cache the results
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: groupsWithCounts,
        timestamp: Date.now()
      }));

      if (append) {
        setGroups(prev => [...prev, ...groupsWithCounts]);
      } else {
        setGroups(groupsWithCounts);
      }

      setHasMore(groupsWithCounts.length === GROUPS_PER_PAGE);
      setLastFetched(Date.now());

    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [user, isAnonymous]);

  const refreshGroups = useCallback(async () => {
    // Clear cache and refetch
    const cacheKeys = Object.keys(sessionStorage).filter(key => key.startsWith('groups_'));
    cacheKeys.forEach(key => sessionStorage.removeItem(key));
    await fetchGroups(0, false);
  }, [fetchGroups]);

  const loadMoreGroups = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = Math.floor(groups.length / GROUPS_PER_PAGE);
    await fetchGroups(nextPage, true);
  }, [hasMore, loading, groups.length, fetchGroups]);

  useEffect(() => {
    if (user || isAnonymous) {
      fetchGroups(0, false);
    }
  }, [user, isAnonymous, fetchGroups]);

  return {
    groups,
    loading,
    error,
    refreshGroups,
    loadMoreGroups,
    hasMore,
  };
}; 