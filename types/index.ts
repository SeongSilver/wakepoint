export interface Alarm {
  id: string;
  owner_id: string;
  created_by: string;
  label: string;
  target_lat: number;
  target_lng: number;
  target_address: string;
  radius_km: number;
  is_active: boolean;
  triggered_at?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar_url?: string;
  push_token?: string;
  created_at?: string;
}

export interface AlarmPermission {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  expires_at?: string;
  created_at: string;
}

export interface FriendRelation {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}
