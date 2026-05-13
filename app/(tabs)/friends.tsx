import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-3">
        <Text className="text-3xl font-semibold text-gray-900">친구</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 rounded-full bg-indigo-50 items-center justify-center mb-2">
          <Ionicons name="people" size={48} color="#4F46E5" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mt-6 text-center">
          친구 기능 준비 중
        </Text>
        <Text className="text-sm text-gray-500 mt-2 text-center leading-5">
          곧 친구와 알람을 공유할 수 있어요
        </Text>
      </View>
    </SafeAreaView>
  );
}
