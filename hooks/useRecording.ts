import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';

// 확장자 → MIME 매핑 (Storage 업로드 Content-Type 용)
const MIME_BY_EXT: Record<string, string> = {
  m4a: 'audio/m4a',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  opus: 'audio/opus',
  flac: 'audio/flac',
  caf: 'audio/x-caf',
  amr: 'audio/amr',
  '3gp': 'audio/3gpp',
};

function extFromName(name: string | null | undefined): string {
  if (!name) return 'm4a';
  const dot = name.lastIndexOf('.');
  if (dot === -1) return 'm4a';
  const ext = name.slice(dot + 1).toLowerCase();
  return MIME_BY_EXT[ext] ? ext : 'm4a';
}

export function useRecording() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const previewSoundRef = useRef<Audio.Sound | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  // 'recording' = 직접 녹음, 'file' = 기기 파일 선택
  const [soundSource, setSoundSource] = useState<'recording' | 'file' | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // 업로드 시 사용할 확장자 (recording=m4a, file=원본 확장자)
  const extRef = useRef<string>('m4a');

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('[useRecording] startRecording:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return;

    try {
      const status = await rec.getStatusAsync();
      const millis = status.isRecording ? (status.durationMillis ?? 0) : 0;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      if (uri) {
        extRef.current = 'm4a';
        setRecordingUri(uri);
        setSoundSource('recording');
        setFileName(null);
        setDurationSec(Math.max(1, Math.round(millis / 1000)));
      }
    } catch (err) {
      console.error('[useRecording] stopRecording:', err);
      setIsRecording(false);
    }
  }, []);

  // 기기에서 오디오 파일 선택
  const pickAudioFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      extRef.current = extFromName(asset.name);
      setRecordingUri(asset.uri);
      setSoundSource('file');
      setFileName(asset.name ?? '선택한 파일');
      setDurationSec(0);
    } catch (err) {
      console.error('[useRecording] pickAudioFile:', err);
    }
  }, []);

  const playPreview = useCallback(async () => {
    if (!recordingUri || isPlaying) return;

    try {
      if (previewSoundRef.current) {
        await previewSoundRef.current.unloadAsync().catch(() => {});
        previewSoundRef.current = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      previewSoundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync().catch(() => {});
          previewSoundRef.current = null;
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.error('[useRecording] playPreview:', err);
      setIsPlaying(false);
    }
  }, [recordingUri, isPlaying]);

  // 업로드 성공 시 public URL 반환, 실패 시 throw (호출부에서 메시지 표시)
  const uploadRecording = useCallback(async (userId: string): Promise<string> => {
    if (!recordingUri) throw new Error('업로드할 알람음이 없습니다.');

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';
    const ext = extRef.current || 'm4a';
    const contentType = MIME_BY_EXT[ext] ?? 'audio/m4a';
    const path = `${userId}/${Date.now()}.${ext}`;

    const result = await uploadAsync(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/alarm-sounds/${path}`,
      recordingUri,
      {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
          'Content-Type': contentType,
        },
      }
    );

    if (result.status !== 200) {
      // Storage 에러 본문을 그대로 노출 (예: "Bucket not found", RLS 거부 등)
      let detail = result.body ?? '';
      try {
        const parsed = JSON.parse(result.body);
        detail = parsed.message || parsed.error || result.body;
      } catch {
        /* body가 JSON이 아니면 원문 사용 */
      }
      throw new Error(`업로드 실패 (HTTP ${result.status}): ${detail}`);
    }

    const { data: urlData } = supabase.storage.from('alarm-sounds').getPublicUrl(path);
    return urlData.publicUrl;
  }, [recordingUri]);

  const clearRecording = useCallback(async () => {
    if (previewSoundRef.current) {
      await previewSoundRef.current.unloadAsync().catch(() => {});
      previewSoundRef.current = null;
    }
    extRef.current = 'm4a';
    setRecordingUri(null);
    setSoundSource(null);
    setFileName(null);
    setDurationSec(0);
    setIsPlaying(false);
  }, []);

  return {
    isRecording,
    recordingUri,
    isPlaying,
    durationSec,
    soundSource,
    fileName,
    startRecording,
    stopRecording,
    pickAudioFile,
    playPreview,
    uploadRecording,
    clearRecording,
  };
}
