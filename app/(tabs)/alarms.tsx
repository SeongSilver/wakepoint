import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlarmStore } from '@/store/alarmStore';
import { useAlarmPermissions, ReceivedPermissionRequest } from '@/hooks/useAlarmPermissions';
import { useUserStore } from '@/store/userStore';
import { Alarm, AlarmRingState } from '@/types';
import { formatDistance } from '@/lib/location';

const RINGING_KEY = 'wakepoint-ringing';

function AlarmCard({ alarm, onDelete }: { alarm: Alarm; onDelete: (id: string) => void }) {
  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 border border-[#e0e0e0] overflow-hidden flex-row">
      {/* 왼쪽 상태 인디케이터 */}
      <View className={`w-1 ${alarm.is_active ? 'bg-[#0066cc]' : 'bg-[#e0e0e0]'}`} />
      <View className="flex-1 p-6">
        {/* 1행: 소형 레이블 + 상태 배지 */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-ink-muted" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
            {alarm.label}
          </Text>
          <View className={`rounded-full px-2 py-0.5 ${alarm.is_active ? 'bg-[rgba(0,102,204,0.1)]' : 'bg-[#f5f5f7]'}`}>
            <Text className={`text-xs font-normal ${alarm.is_active ? 'text-[#0066cc]' : 'text-[#7a7a7a]'}`}>
              {alarm.is_active ? '활성' : '비활성'}
            </Text>
          </View>
        </View>

        {/* 2행: 대형 목적지 주소 */}
        <Text className="text-xl font-semibold text-ink mb-3" numberOfLines={2}>
          {alarm.target_address || alarm.label}
        </Text>

        {/* 3행: 반경 정보 + 삭제 버튼 */}
        <View className="flex-row items-center">
          <View className="flex-row items-center flex-1">
            <Ionicons name="location-outline" size={14} color="#7a7a7a" />
            <Text className="text-sm text-ink-muted ml-1.5">{formatDistance(alarm.radius_km)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(alarm.id)}
            className="bg-danger rounded-full px-3 py-1.5 active:scale-95"
          >
            <Text className="text-xs font-normal text-white">삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PermissionRequestItem({
  request,
  responding,
  onRespond,
}: {
  request: ReceivedPermissionRequest;
  responding: boolean;
  onRespond: (id: string, status: 'accepted' | 'rejected') => void;
}) {
  return (
    <View className="mb-2 last:mb-0">
      <Text className="text-[14px] text-ink mb-2" numberOfLines={2}>
        <Text className="font-semibold">{request.requesterProfile.nickname}</Text>
        {'님이 알람 권한을 요청했습니다'}
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onRespond(request.id, 'accepted')}
          disabled={responding}
          className="flex-1 bg-primary rounded-full py-2 items-center active:scale-95"
        >
          {responding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-[13px] font-semibold text-white">수락</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onRespond(request.id, 'rejected')}
          disabled={responding}
          className="flex-1 bg-canvas border border-hairline rounded-full py-2 items-center active:scale-95"
        >
          <Text className="text-[13px] font-semibold text-ink-muted">거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-parchment items-center justify-center mb-2">
        <Ionicons name="location-outline" size={48} color="#0066cc" />
      </View>
      <Text className="text-2xl font-semibold text-ink mt-6 text-center">
        아직 알람이 없어요
      </Text>
      <Text className="text-sm text-ink-muted mt-2 text-center leading-5">
        목적지를 설정하면 근처에 도착했을 때{'\n'}자동으로 알림을 보내드릴게요
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)')}
        className="mt-6 bg-primary rounded-full px-6 py-3 active:scale-95"
      >
        <Text className="text-white font-semibold text-sm">지도에서 알람 설정하기</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AlarmsScreen() {
  const activeAlarms = useAlarmStore((s) => s.activeAlarms);
  const removeAlarm = useAlarmStore((s) => s.removeAlarm);
  const ringingAlarm = useAlarmStore((s) => s.ringingAlarm);
  const setRingingAlarm = useAlarmStore((s) => s.setRingingAlarm);
  const profile = useUserStore((s) => s.profile);
  const { receivedPending, respondingId, fetchReceivedPending, respondToRequest } =
    useAlarmPermissions();
  const ringerSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (profile?.id) fetchReceivedPending();
  }, [profile?.id, fetchReceivedPending]);

  useEffect(() => {
    const checkRinging = async () => {
      const raw = await AsyncStorage.getItem(RINGING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AlarmRingState;
        setRingingAlarm(parsed);
      }
    };
    checkRinging();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkRinging();
    });
    return () => sub.remove();
  }, [setRingingAlarm]);

  useEffect(() => {
    if (!ringingAlarm) return;

    // 반복 진동: 700ms 울림 → 400ms 쉬고 반복 (중지 버튼 누를 때까지)
    Vibration.vibrate([0, 700, 400], true);

    if (ringingAlarm.soundType === 'custom' && ringingAlarm.soundUri) {
      (async () => {
        try {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          const { sound } = await Audio.Sound.createAsync(
            { uri: ringingAlarm.soundUri! },
            { isLooping: true, shouldPlay: true }
          );
          ringerSoundRef.current = sound;
        } catch (err) {
          console.error('[AlarmsScreen] ringerSound error:', err);
        }
      })();
    }

    return () => {
      Vibration.cancel();
      ringerSoundRef.current?.stopAsync().catch(() => {});
      ringerSoundRef.current?.unloadAsync().catch(() => {});
      ringerSoundRef.current = null;
    };
  }, [ringingAlarm]);

  const stopRinger = async () => {
    Vibration.cancel();
    if (ringerSoundRef.current) {
      try {
        await ringerSoundRef.current.stopAsync();
        await ringerSoundRef.current.unloadAsync();
      } catch {}
      ringerSoundRef.current = null;
    }
    await AsyncStorage.removeItem(RINGING_KEY);
    setRingingAlarm(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f7]">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text className="text-[30px] font-semibold text-[#1d1d1f]">알람</Text>
        {activeAlarms.length > 0 && (
          <Text className="text-sm text-[#7a7a7a]">{activeAlarms.length}개 활성화됨</Text>
        )}
      </View>

      {/* 알람 울리는 중 배너 */}
      {ringingAlarm && (
        <View className="mx-4 mb-2 bg-white border border-[#e0e0e0] rounded-2xl overflow-hidden">
          <View className="flex-row items-center px-4 py-3">
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: 'rgba(0,102,204,0.10)' }}
            >
              <Ionicons name="alarm" size={18} color="#0066cc" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-primary">알람 울리는 중</Text>
              <Text className="text-[12px] text-ink-muted mt-0.5" numberOfLines={1}>
                {ringingAlarm.label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={stopRinger}
              className="bg-primary rounded-full px-4 py-2 active:scale-95 ml-3"
            >
              <Text className="text-xs font-semibold text-white">중지</Text>
            </TouchableOpacity>
          </View>
          <View className="h-1 bg-primary/10" />
        </View>
      )}

      {/* 권한 요청 배너 */}
      {receivedPending.length > 0 && (
        <View className="mx-4 mb-2 bg-white border border-[#e0e0e0] rounded-2xl p-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="notifications-outline" size={16} color="#0066cc" />
            <Text className="text-[13px] font-semibold text-primary ml-1.5">
              알람 권한 요청 {receivedPending.length}건
            </Text>
          </View>
          {receivedPending.map((req, index) => (
            <View key={req.id}>
              {index > 0 && <View className="border-t border-hairline my-2" />}
              <PermissionRequestItem
                request={req}
                responding={respondingId === req.id}
                onRespond={respondToRequest}
              />
            </View>
          ))}
        </View>
      )}

      {activeAlarms.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={activeAlarms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlarmCard alarm={item} onDelete={removeAlarm} />
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — 지도로 이동해 알람 추가 */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)')}
        className="absolute bottom-24 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center"
        style={{
          elevation: 6,
          shadowColor: '#0066cc',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
