# SCHEMA.md — WakePoint DB 스키마

Supabase PostgreSQL 기반. 모든 테이블은 RLS(Row Level Security) 적용.

---

## 테이블 구조

### `user_profiles`
Supabase Auth의 `auth.users`를 확장한 프로필 테이블.

```sql
create table public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  nickname     text not null,
  avatar_url   text,
  push_token   text,                        -- FCM / Expo Push Token
  created_at   timestamptz default now()
);

-- 신규 유저 가입 시 자동 생성
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, nickname)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### `alarms`
위치 알람 정보.

```sql
create table public.alarms (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.user_profiles(id) on delete cascade,
  created_by       uuid not null references public.user_profiles(id),  -- 본인 or 친구
  label            text not null default '알람',
  target_lat       double precision not null,
  target_lng       double precision not null,
  target_address   text,
  radius_km        numeric(5,2) not null default 0.5
                   check (radius_km >= 0.1 and radius_km <= 50),
  is_active        boolean not null default true,
  triggered_at     timestamptz,                    -- 알람이 울린 시각
  created_at       timestamptz default now()
);

-- 인덱스
create index alarms_owner_id_idx on public.alarms(owner_id);
create index alarms_is_active_idx on public.alarms(is_active);
```

---

### `friends`
친구 관계 (양방향).

```sql
create table public.friends (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.user_profiles(id) on delete cascade,
  friend_id   uuid not null references public.user_profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, friend_id)
);

create index friends_user_id_idx on public.friends(user_id);
```

---

### `alarm_permissions`
친구 대리 알람 설정 권한.

```sql
create type permission_status as enum ('pending', 'accepted', 'rejected');

create table public.alarm_permissions (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid not null references public.user_profiles(id) on delete cascade,
  target_id      uuid not null references public.user_profiles(id) on delete cascade,
  status         permission_status not null default 'pending',
  expires_at     timestamptz,                       -- null = 영구 권한
  created_at     timestamptz default now(),
  unique(requester_id, target_id)
);
```

---

## RLS 정책

```sql
-- user_profiles: 본인만 수정, 친구는 읽기 가능
alter table public.user_profiles enable row level security;

create policy "본인 프로필 읽기/수정"
  on public.user_profiles for all
  using (auth.uid() = id);

create policy "닉네임/아바타 공개 읽기"
  on public.user_profiles for select
  using (true);

-- alarms: 본인 소유 알람만 접근
alter table public.alarms enable row level security;

create policy "본인 알람 전체 접근"
  on public.alarms for all
  using (auth.uid() = owner_id);

create policy "권한 있는 친구가 알람 생성 가능"
  on public.alarms for insert
  with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.alarm_permissions
      where requester_id = auth.uid()
        and target_id = owner_id
        and status = 'accepted'
    )
  );

-- friends: 본인 친구 관계만 접근
alter table public.friends enable row level security;

create policy "본인 친구 목록 접근"
  on public.friends for all
  using (auth.uid() = user_id);

-- alarm_permissions: 요청자/대상자만 접근
alter table public.alarm_permissions enable row level security;

create policy "관련 당사자만 접근"
  on public.alarm_permissions for all
  using (auth.uid() = requester_id or auth.uid() = target_id);
```

---

## ERD (텍스트)

```
auth.users
    │
    └── user_profiles (1:1)
            │
            ├── alarms (1:N)  ← owner_id, created_by
            │
            ├── friends (1:N) ← user_id ↔ friend_id
            │
            └── alarm_permissions (1:N) ← requester_id, target_id
```

---

## Supabase TypeScript 타입 생성

```bash
# 로컬 개발 환경에서 타입 자동 생성
npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts
```
