-- 알람 커스텀 녹음 사운드 컬럼 추가
ALTER TABLE public.alarms ADD COLUMN IF NOT EXISTS sound_type text DEFAULT 'default';
ALTER TABLE public.alarms ADD COLUMN IF NOT EXISTS sound_uri text;

-- alarm-sounds 버킷 생성 (Supabase Dashboard > Storage에서 수동으로 생성하거나 아래 실행)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('alarm-sounds', 'alarm-sounds', true)
-- ON CONFLICT (id) DO NOTHING;

-- alarm-sounds 버킷 RLS 정책 (인증된 사용자만 업로드, 공개 읽기)
-- CREATE POLICY "authenticated users can upload alarm sounds"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'alarm-sounds' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "alarm sounds are publicly readable"
--   ON storage.objects FOR SELECT TO public
--   USING (bucket_id = 'alarm-sounds');
