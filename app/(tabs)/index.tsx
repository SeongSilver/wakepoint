import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm } from '@/types';
import { formatDistance } from '@/lib/location';

function AlarmCard({ alarm, onDelete }: { alarm: Alarm; onDelete: (id: string) => void }) {
  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-900">{alarm.label}</Text>
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
            {alarm.target_address || '주소 없음'}
          </Text>
        </View>
        <View className="items-end">
          <View className="bg-indigo-100 rounded-full px-3 py-1">
            <Text className="text-xs font-medium text-indigo-700">
              {formatDistance(alarm.radius_km)}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center flex-1">
          <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
          <Text className="text-xs text-gray-500">활성화됨</Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(alarm.id)}
          className="bg-red-50 rounded-lg px-3 py-1.5"
        >
          <Text className="text-xs font-medium text-red-500">삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-indigo-50 items-center justify-center mb-2">
        <Text style={{ fontSize: 48 }}>📍</Text>
      </View>
      <Text className="text-xl font-bold text-gray-800 mt-6 text-center">
        알람이 없어요
      </Text>
      <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
        목적지를 설정하면 근처에 도착했을 때{'\n'}자동으로 알림을 보내드릴게요
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/map')}
        className="mt-6 bg-indigo-600 rounded-xl px-6 py-3"
      >
        <Text className="text-white font-semibold text-sm">지도에서 알람 설정하기</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { activeAlarms, removeAlarm } = useAlarmStore();

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* 헤더 */}
      <View className="px-4 pt-4 pb-3 bg-gray-50">
        <Text className="text-2xl font-bold text-gray-900">내 알람</Text>
        {activeAlarms.length > 0 && (
          <Text className="text-sm text-gray-500 mt-1">
            {activeAlarms.length}개 활성화됨
          </Text>
        )}
      </View>

      {activeAlarms.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={activeAlarms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlarmCard alarm={item} onDelete={removeAlarm} />
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — 알람 추가 */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/map')}
        className="absolute bottom-8 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
        style={{
          elevation: 6,
          shadowColor: '#4F46E5',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        }}
      >
        <Text className="text-white text-3xl leading-none" style={{ marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
