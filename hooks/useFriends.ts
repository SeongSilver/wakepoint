import { supabase } from '@/lib/supabase';
import { UserProfile, FriendRelation } from '@/types';

export function useFriends() {
  const fetchFriends = async (userId: string): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        friend_id,
        user_profiles!friends_friend_id_fkey (
          id, nickname, avatar_url
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return (data?.map((d) => d.user_profiles) ?? []) as unknown as UserProfile[];
  };

  const addFriend = async (myId: string, friendId: string) => {
    const { error } = await supabase.from('friends').insert([
      { user_id: myId, friend_id: friendId },
      { user_id: friendId, friend_id: myId },
    ]);
    if (error) throw error;
  };

  const searchByEmail = async (query: string): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, nickname, avatar_url')
      .ilike('email', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data as UserProfile[];
  };

  return { fetchFriends, addFriend, searchByEmail };
}
