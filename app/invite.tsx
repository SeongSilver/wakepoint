import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

type InviteStatus = 'processing' | 'done' | 'already_friends' | 'error';

export default function InviteScreen() {
  const { from } = useLocalSearchParams<{ from: string }>();
  const [status, setStatus] = useState<InviteStatus>('processing');

  useEffect(() => {
    const processInvite = async () => {
      if (!from) {
        router.replace('/(tabs)/friends');
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // 로그인 필요 — 로그인 후 초대 링크를 다시 클릭해야 함
          router.replace('/(auth)/login');
          return;
        }

        const userId = session.user.id;

        if (from === userId) {
          router.replace('/(tabs)/friends');
          return;
        }

        // 이미 친구인지 확인
        const { data: existing } = await supabase
          .from('friends')
          .select('id')
          .eq('user_id', userId)
          .eq('friend_id', from)
          .maybeSingle();

        if (existing) {
          setStatus('already_friends');
          setTimeout(() => router.replace('/(tabs)/friends'), 1200);
          return;
        }

        const { error } = await supabase
          .from('friends')
          .insert({ user_id: userId, friend_id: from });

        if (error) throw error;

        setStatus('done');
        setTimeout(() => router.replace('/(tabs)/friends'), 1200);
      } catch {
        setStatus('error');
        setTimeout(() => router.replace('/(tabs)/friends'), 1500);
      }
    };

    processInvite();
  // 마운트 시 1회만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content: Record<InviteStatus, { emoji: string; title: string; sub: string }> = {
    processing: {
      emoji: '',
      title: '초대 처리 중...',
      sub: '잠시만 기다려주세요',
    },
    done: {
      emoji: '🎉',
      title: '친구 추가 완료!',
      sub: '친구 목록으로 이동합니다',
    },
    already_friends: {
      emoji: '👋',
      title: '이미 친구입니다',
      sub: '친구 목록으로 이동합니다',
    },
    error: {
      emoji: '⚠️',
      title: '처리에 실패했습니다',
      sub: '친구 목록에서 직접 추가해주세요',
    },
  };

  const { emoji, title, sub } = content[status];

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-8">
      {status === 'processing' ? (
        <>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text className="text-[17px] font-semibold text-ink mt-4">{title}</Text>
          <Text className="text-[14px] text-ink-muted mt-2 text-center">{sub}</Text>
        </>
      ) : (
        <>
          <Text className="text-5xl mb-4">{emoji}</Text>
          <Text className="text-[17px] font-semibold text-ink">{title}</Text>
          <Text className="text-[14px] text-ink-muted mt-2 text-center">{sub}</Text>
        </>
      )}
    </View>
  );
}
