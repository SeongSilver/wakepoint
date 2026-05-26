import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { UserProfile } from '@/types';
import { sendFcmToUser } from '@/lib/firebase';

export interface ReceivedPermissionRequest {
  id: string;
  requester_id: string;
  created_at: string;
  requesterProfile: UserProfile;
}

export interface SentPermissionRequest {
  id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface AcceptedFriend {
  permissionId: string;
  profile: UserProfile;
}

interface ReceivedPermissionRow {
  id: string;
  requester_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user_profiles: {
    id: string;
    email: string;
    nickname: string;
    avatar_url: string | null;
    push_token: string | null;
  } | null;
}

interface AcceptedPermissionRow {
  id: string;
  target_id: string;
  user_profiles: {
    id: string;
    email: string;
    nickname: string;
    avatar_url: string | null;
    push_token: string | null;
  } | null;
}

export function useAlarmPermissions() {
  const profile = useUserStore((s) => s.profile);

  const [sentRequests, setSentRequests] = useState<SentPermissionRequest[]>([]);
  const [receivedPending, setReceivedPending] = useState<ReceivedPermissionRequest[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<AcceptedFriend[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [loadingReceived, setLoadingReceived] = useState(false);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchSentRequests = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingSent(true);
    try {
      const { data, error } = await supabase
        .from('alarm_permissions')
        .select('id, target_id, status, created_at')
        .eq('requester_id', profile.id);

      if (error) throw error;
      setSentRequests((data ?? []) as unknown as SentPermissionRequest[]);
    } catch (err) {
      console.error('fetchSentRequests:', err);
    } finally {
      setLoadingSent(false);
    }
  }, [profile?.id]);

  const fetchReceivedPending = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingReceived(true);
    try {
      const { data, error } = await supabase
        .from('alarm_permissions')
        .select(`
          id,
          requester_id,
          status,
          created_at,
          user_profiles!alarm_permissions_requester_id_fkey (
            id, email, nickname, avatar_url, push_token
          )
        `)
        .eq('target_id', profile.id)
        .eq('status', 'pending');

      if (error) throw error;

      const requests: ReceivedPermissionRequest[] = (
        data as unknown as ReceivedPermissionRow[]
      )
        .filter((row) => row.user_profiles !== null)
        .map((row) => ({
          id: row.id,
          requester_id: row.requester_id,
          created_at: row.created_at,
          requesterProfile: row.user_profiles as UserProfile,
        }));

      setReceivedPending(requests);
    } catch (err) {
      console.error('fetchReceivedPending:', err);
    } finally {
      setLoadingReceived(false);
    }
  }, [profile?.id]);

  const requestPermission = useCallback(async (targetId: string, targetPushToken?: string) => {
    if (!profile?.id) return;
    setRequestingId(targetId);
    try {
      const { data, error } = await supabase
        .from('alarm_permissions')
        .insert({ requester_id: profile.id, target_id: targetId, status: 'pending' })
        .select('id, target_id, status, created_at')
        .single();

      if (error) throw error;

      setSentRequests((prev) => [...prev, data as unknown as SentPermissionRequest]);

      if (targetPushToken && profile.nickname) {
        sendFcmToUser(targetPushToken, {
          title: '알람 설정 권한 요청 🔔',
          body: `${profile.nickname}님이 알람 설정 권한을 요청했어요`,
        }).catch(() => {});
      }
    } finally {
      setRequestingId(null);
    }
  }, [profile]);

  const respondToRequest = useCallback(async (
    permissionId: string,
    status: 'accepted' | 'rejected',
  ) => {
    setRespondingId(permissionId);
    try {
      const { error } = await supabase
        .from('alarm_permissions')
        .update({ status })
        .eq('id', permissionId);

      if (error) throw error;

      setReceivedPending((prev) => prev.filter((r) => r.id !== permissionId));
    } finally {
      setRespondingId(null);
    }
  }, []);

  const fetchAcceptedFriends = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingAccepted(true);
    try {
      const { data, error } = await supabase
        .from('alarm_permissions')
        .select(`
          id,
          target_id,
          user_profiles!alarm_permissions_target_id_fkey (
            id, email, nickname, avatar_url, push_token
          )
        `)
        .eq('requester_id', profile.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const friends: AcceptedFriend[] = (data as unknown as AcceptedPermissionRow[])
        .filter((row) => row.user_profiles !== null)
        .map((row) => ({
          permissionId: row.id,
          profile: row.user_profiles as UserProfile,
        }));

      setAcceptedFriends(friends);
    } catch (err) {
      console.error('fetchAcceptedFriends:', err);
    } finally {
      setLoadingAccepted(false);
    }
  }, [profile?.id]);

  const getSentStatus = useCallback(
    (targetId: string): 'pending' | 'accepted' | 'rejected' | null =>
      sentRequests.find((r) => r.target_id === targetId)?.status ?? null,
    [sentRequests],
  );

  return {
    sentRequests,
    receivedPending,
    acceptedFriends,
    loadingSent,
    loadingReceived,
    loadingAccepted,
    requestingId,
    respondingId,
    fetchSentRequests,
    fetchReceivedPending,
    fetchAcceptedFriends,
    requestPermission,
    respondToRequest,
    getSentStatus,
  };
}
