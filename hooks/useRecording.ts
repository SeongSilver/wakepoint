import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

export function useRecording() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const previewSoundRef = useRef<Audio.Sound | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationSec, setDurationSec] = useState(0);

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
        setRecordingUri(uri);
        setDurationSec(Math.max(1, Math.round(millis / 1000)));
      }
    } catch (err) {
      console.error('[useRecording] stopRecording:', err);
      setIsRecording(false);
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

  const uploadRecording = useCallback(async (userId: string): Promise<string | null> => {
    if (!recordingUri) return null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? '';
      const path = `${userId}/${Date.now()}.m4a`;

      const result = await uploadAsync(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/alarm-sounds/${path}`,
        recordingUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.BINARY_CONTENT,
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
            'Content-Type': 'audio/m4a',
          },
        }
      );

      if (result.status !== 200) throw new Error(`Upload HTTP ${result.status}`);

      const { data: urlData } = supabase.storage.from('alarm-sounds').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error('[useRecording] uploadRecording:', err);
      return null;
    }
  }, [recordingUri]);

  const clearRecording = useCallback(async () => {
    if (previewSoundRef.current) {
      await previewSoundRef.current.unloadAsync().catch(() => {});
      previewSoundRef.current = null;
    }
    setRecordingUri(null);
    setDurationSec(0);
    setIsPlaying(false);
  }, []);

  return {
    isRecording,
    recordingUri,
    isPlaying,
    durationSec,
    startRecording,
    stopRecording,
    playPreview,
    uploadRecording,
    clearRecording,
  };
}
