import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm } from '@/types';
import { formatDistance } from '@/lib/location';

function AlarmCard({ alarm, onDelete }: { alarm: Alarm; onDelete: (id: string) => void }) {
  return (
    <View
      className="flex-row bg-white rounded-2xl mx-4 mb-3 border border-gray-100 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="w-1 bg-indigo-600" />
      <View className="flex-1 p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-base font-semibold text-gray-900">{alarm.label}</Text>
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
              {alarm.target_address || '주소 없음'}
            </Text>
          </View>
          <View className="bg-emerald-100 rounded-full px-2 py-0.5">
            <Text className="text-xs text-emerald-700">
              {formatDistance(alarm.radius_km)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center flex-1">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-xs text-gray-500">활성화됨</Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(alarm.id)}
            className="bg-red-500 rounded-full px-3 py-1.5 active:scale-95"
          >
            <Text className="text-xs font-medium text-white">삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-indigo-50 items-center justify-center mb-2">
        <Ionicons name="walk" size={48} color="#4F46E5" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 mt-6 text-center">
        아직 알람이 없어요
      </Text>
      <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
        목적지를 설정하면 근처에 도착했을 때{'\n'}자동으로 알림을 보내드릴게요
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/map')}
        className="mt-6 bg-indigo-600 rounded-full px-6 py-3 active:scale-95"
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
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />

      {/* 헤더 */}
      <View className="px-4 pt-4 pb-3 bg-gray-50">
        <Text className="text-3xl font-semibold text-gray-900">다왔어</Text>
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

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/map')}
        className="absolute bottom-8 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center"
        style={{
          elevation: 8,
          shadowColor: '#4F46E5',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
