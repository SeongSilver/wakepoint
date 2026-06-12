-- alarm-sounds Storage 버킷 + RLS 정책
-- 녹음/파일 알람음 업로드가 동작하려면 이 마이그레이션이 반드시 적용되어야 함.
-- (기존 20260519 마이그레이션에서는 주석 처리되어 미적용 상태였음 → 업로드 실패 원인)

-- 1. 버킷 생성 (공개 읽기)
insert into storage.buckets (id, name, public)
values ('alarm-sounds', 'alarm-sounds', true)
on conflict (id) do update set public = true;

-- 2. RLS 정책 (재실행 안전하도록 drop 후 재생성)
drop policy if exists "authenticated users can upload alarm sounds" on storage.objects;
drop policy if exists "users can update own alarm sounds" on storage.objects;
drop policy if exists "users can delete own alarm sounds" on storage.objects;
drop policy if exists "alarm sounds are publicly readable" on storage.objects;

-- 인증된 사용자는 자기 폴더(userId/...)에만 업로드 가능
create policy "authenticated users can upload alarm sounds"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'alarm-sounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 파일 덮어쓰기/수정
create policy "users can update own alarm sounds"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'alarm-sounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 파일 삭제
create policy "users can delete own alarm sounds"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'alarm-sounds'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 알람음은 공개 읽기 (친구 알람 재생 위해)
create policy "alarm sounds are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'alarm-sounds');
