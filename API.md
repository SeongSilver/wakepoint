# API.md — WakePoint API 명세

---

## Supabase API

### 인증

#### 이메일 회원가입
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});
```

#### 소셜 로그인 (Google)
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'wakepoint://auth/callback' },
});
```

#### 로그아웃
```typescript
await supabase.auth.signOut();
```

#### 현재 세션
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

---

### 알람 API

#### 알람 생성
```typescript
// 본인이 직접 설정
const { data, error } = await supabase
  .from('alarms')
  .insert({
    owner_id: userId,
    created_by: userId,
    label: '집에 거의 다 왔어요',
    target_lat: 37.5665,
    target_lng: 126.9780,
    target_address: '서울시 중구',
    radius_km: 0.5,
  })
  .select()
  .single();
```

#### 친구 대신 알람 설정
```typescript
// created_by = 친구 ID, owner_id = 상대방 ID
const { data, error } = await supabase
  .from('alarms')
  .insert({
    owner_id: targetUserId,       // 알람 울릴 대상
    created_by: myUserId,         // 설정한 사람 (나)
    label: '친구가 설정해준 알람',
    target_lat: 37.5665,
    target_lng: 126.9780,
    radius_km: 1.0,
  })
  .select()
  .single();
```

#### 알람 목록 조회
```typescript
const { data, error } = await supabase
  .from('alarms')
  .select('*')
  .eq('owner_id', userId)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

#### 알람 삭제
```typescript
const { error } = await supabase
  .from('alarms')
  .delete()
  .eq('id', alarmId);
```

#### 알람 트리거 기록
```typescript
const { error } = await supabase
  .from('alarms')
  .update({ triggered_at: new Date().toISOString(), is_active: false })
  .eq('id', alarmId);
```

---

### 친구 API

#### 이메일로 친구 검색
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('id, nickname, avatar_url')
  .ilike('email', `%${searchQuery}%`)
  .limit(10);
```

#### 친구 추가
```typescript
// 양방향으로 두 레코드 동시 삽입
const { error } = await supabase.from('friends').insert([
  { user_id: myId, friend_id: friendId },
  { user_id: friendId, friend_id: myId },
]);
```

#### 친구 목록 조회
```typescript
const { data, error } = await supabase
  .from('friends')
  .select(`
    friend_id,
    user_profiles!friends_friend_id_fkey (
      id, nickname, avatar_url
    )
  `)
  .eq('user_id', myId);
```

---

### 알람 권한 API

#### 권한 요청 (친구에게)
```typescript
const { error } = await supabase.from('alarm_permissions').insert({
  requester_id: myId,
  target_id: friendId,
  status: 'pending',
});
```

#### 대기 중인 권한 요청 조회
```typescript
const { data, error } = await supabase
  .from('alarm_permissions')
  .select(`
    *,
    requester: user_profiles!alarm_permissions_requester_id_fkey (
      nickname, avatar_url
    )
  `)
  .eq('target_id', myId)
  .eq('status', 'pending');
```

#### 권한 수락/거절
```typescript
const { error } = await supabase
  .from('alarm_permissions')
  .update({ status: accept ? 'accepted' : 'rejected' })
  .eq('id', permissionId);
```

---

## Supabase Realtime

### 내 알람 변경 구독 (친구가 설정해줄 때 수신)
```typescript
const channel = supabase
  .channel('my-alarms')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'alarms', filter: `owner_id=eq.${userId}` },
    (payload) => console.log('새 알람 수신:', payload.new)
  )
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'alarms', filter: `owner_id=eq.${userId}` },
    (payload) => console.log('알람 삭제됨:', payload.old)
  )
  .subscribe();

// 구독 해제
supabase.removeChannel(channel);
```

---

## FCM (Firebase Cloud Messaging)

### Expo Push Token 발급 & 저장
```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function getAndSavePushToken(userId: string) {
  if (!Constants.isDevice) return; // 실기기에서만 동작

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })
  ).data;

  await supabase
    .from('user_profiles')
    .update({ push_token: token })
    .eq('id', userId);
}
```

### 서버에서 Push 발송 (Edge Function)
```typescript
// supabase/functions/send-alarm-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { targetUserId, alarmLabel } = await req.json();

  // 대상 유저 push_token 조회
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('push_token')
    .eq('id', targetUserId)
    .single();

  if (!profile?.push_token) return new Response('No token', { status: 400 });

  // Expo Push API로 발송
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: profile.push_token,
      title: '📍 친구가 알람을 설정했어요!',
      body: `"${alarmLabel}" 알람이 활성화되었습니다`,
      sound: 'default',
    }),
  });

  return new Response(JSON.stringify(await res.json()));
});
```

---

## 에러 코드 정의

| 코드 | 메시지 | 상황 |
|------|--------|------|
| `LOCATION_PERMISSION_DENIED` | 위치 권한이 거부되었습니다 | 권한 미허용 |
| `BACKGROUND_PERMISSION_DENIED` | 백그라운드 위치 권한이 필요합니다 | 백그라운드 권한 미허용 |
| `ALARM_RADIUS_TOO_SMALL` | 반경은 100m 이상이어야 합니다 | 반경 값 오류 |
| `PERMISSION_NOT_ACCEPTED` | 친구가 아직 권한을 수락하지 않았습니다 | 대리 알람 권한 없음 |
| `PUSH_TOKEN_NOT_FOUND` | 알림을 전송할 수 없습니다 | FCM 토큰 없음 |
