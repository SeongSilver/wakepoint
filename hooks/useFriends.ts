import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { useUserStore } from '@/store/userStore';

export interface FriendEntry {
  rowId: string;
  profile: UserProfile;
  createdAt: string;
}

interface FriendRow {
  id: string;
  created_at: string;
  user_profiles: {
    id: string;
    email: string;
    nickname: string;
    avatar_url: string | null;
    push_token: string | null;
  } | null;
}

export function useFriends() {
  const profile = useUserStore((s) => s.profile);

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          id,
          created_at,
          user_profiles!friends_friend_id_fkey (
            id, email, nickname, avatar_url, push_token
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entries: FriendEntry[] = (data as unknown as FriendRow[])
        .filter((row) => row.user_profiles !== null)
        .map((row) => ({
          rowId: row.id,
          profile: row.user_profiles as UserProfile,
          createdAt: row.created_at,
        }));

      setFriends(entries);
    } catch (err) {
      console.error('fetchFriends:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const searchByEmail = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, nickname, avatar_url, push_token')
        .ilike('email', trimmed)
        .neq('id', profile?.id ?? '')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSearchError('해당 이메일의 사용자를 찾을 수 없습니다');
      } else {
        setSearchResult(data as UserProfile);
      }
    } catch {
      setSearchError('검색 중 오류가 발생했습니다');
    } finally {
      setSearching(false);
    }
  }, [profile?.id]);

  const clearSearch = useCallback(() => {
    setSearchResult(null);
    setSearchError(null);
  }, []);

  const addFriend = useCallback(async (target: UserProfile) => {
    if (!profile?.id) return;
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('friends')
        .insert({ user_id: profile.id, friend_id: target.id })
        .select('id, created_at')
        .single();

      if (error) throw error;

      setFriends((prev) => [
        { rowId: data.id, profile: target, createdAt: data.created_at },
        ...prev,
      ]);
      setSearchResult(null);
      setSearchError(null);
    } finally {
      setAdding(false);
    }
  }, [profile?.id]);

  const removeFriend = useCallback(async (rowId: string) => {
    setRemovingId(rowId);
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', rowId);

      if (error) throw error;

      setFriends((prev) => prev.filter((f) => f.rowId !== rowId));
    } finally {
      setRemovingId(null);
    }
  }, []);

  const isAlreadyFriend = useCallback(
    (userId: string) => friends.some((f) => f.profile.id === userId),
    [friends]
  );

  return {
    friends,
    loading,
    searching,
    adding,
    removingId,
    searchResult,
    searchError,
    fetchFriends,
    searchByEmail,
    clearSearch,
    addFriend,
    removeFriend,
    isAlreadyFriend,
  };
}
