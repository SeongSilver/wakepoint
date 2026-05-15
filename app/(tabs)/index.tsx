import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAlarmStore } from '@/store/alarmStore';
import { useAlarmPermissions, ReceivedPermissionRequest } from '@/hooks/useAlarmPermissions';
import { useUserStore } from '@/store/userStore';
import { Alarm } from '@/types';
import { formatDistance } from '@/lib/location';
import AppHeader from '@/components/ui/AppHeader';

function AlarmCard({ alarm, onDelete }: { alarm: Alarm; onDelete: (id: string) => void }) {
  return (
    <View className="flex-row bg-canvas rounded-[18px] mx-4 mb-3 border border-hairline overflow-hidden">
      <View className={`w-1 ${alarm.is_active ? 'bg-primary' : 'bg-[#e0e0e0]'}`} />
      <View className="flex-1 p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-[17px] font-semibold text-ink">{alarm.label}</Text>
            <Text className="text-sm text-ink-muted mt-1" numberOfLines={1}>
              {alarm.target_address || '주소 없음'}
            </Text>
          </View>
          <View className={`rounded-full px-2 py-0.5 ${alarm.is_active ? 'bg-primary/10' : 'bg-parchment'}`}>
            <Text className={`text-xs font-medium ${alarm.is_active ? 'text-primary' : 'text-ink-muted'}`}>
              {formatDistance(alarm.radius_km)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3 pt-3 border-t border-hairline">
          <View className="flex-row items-center flex-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${alarm.is_active ? 'bg-primary' : 'bg-[#e0e0e0]'}`} />
            <Text className="text-xs text-ink-muted">{alarm.is_active ? '활성화됨' : '비활성'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(alarm.id)}
            className="bg-danger rounded-full px-3 py-1.5 active:scale-95"
          >
            <Text className="text-xs font-medium text-white">삭제</Text>
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
        <Ionicons name="walk" size={48} color="#0066cc" />
      </View>
      <Text className="text-2xl font-semibold text-ink mt-6 text-center">
        아직 알람이 없어요
      </Text>
      <Text className="text-sm text-ink-muted mt-2 text-center leading-5">
        목적지를 설정하면 근처에 도착했을 때{'\n'}자동으로 알림을 보내드릴게요
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/map')}
        className="mt-6 bg-primary rounded-full px-6 py-3 active:scale-95"
      >
        <Text className="text-white font-semibold text-sm">지도에서 알람 설정하기</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { activeAlarms, removeAlarm } = useAlarmStore();
  const profile = useUserStore((s) => s.profile);
  const { receivedPending, respondingId, fetchReceivedPending, respondToRequest } =
    useAlarmPermissions();

  useEffect(() => {
    if (profile?.id) fetchReceivedPending();
  }, [profile?.id, fetchReceivedPending]);

  return (
    <SafeAreaView
      className="flex-1 bg-parchment"
      style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />

      {/* 헤더 */}
      <AppHeader>
        {activeAlarms.length > 0 && (
          <Text className="text-sm text-ink-muted">
            {activeAlarms.length}개 활성화됨
          </Text>
        )}
      </AppHeader>

      {/* 대기 중인 권한 요청 배너 */}
      {receivedPending.length > 0 && (
        <View className="mx-4 mb-2 bg-canvas border border-hairline rounded-[18px] p-4">
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

      {/* FAB — floating 탭바(~80px) 위로 배치 */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/map')}
        className="absolute bottom-24 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
