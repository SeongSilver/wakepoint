import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  const initial = profile?.nickname?.charAt(0)?.toUpperCase() ?? '?';

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          setProfile(null);
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-[#f5f5f7]" showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* 상단 다크 타일 */}
      <View
        className="bg-[#272729] items-center px-6 pb-10"
        style={{ paddingTop: insets.top + 24 }}
      >
        <View className="w-20 h-20 rounded-full bg-[#0066cc] items-center justify-center mb-4">
          <Text className="text-white text-3xl font-semibold">{initial}</Text>
        </View>
        <Text className="text-white font-semibold text-[18px]">
          {profile?.nickname ?? '사용자'}
        </Text>
        <Text className="text-[#cccccc] text-[14px] mt-1">
          {profile?.email ?? ''}
        </Text>
      </View>

      <View className="px-4 pt-6 pb-8">
        {/* 메뉴 섹션 */}
        <View className="bg-[#f5f5f7] rounded-2xl overflow-hidden mb-6">
          <TouchableOpacity
            onPress={() => router.push('/privacy')}
            className="flex-row items-center px-4 py-4 active:bg-white"
            style={{ borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}
          >
            <Ionicons name="shield-outline" size={20} color="#1d1d1f" style={{ marginRight: 12 }} />
            <Text className="flex-1 text-[17px] text-[#1d1d1f]">개인정보처리방침</Text>
            <Ionicons name="chevron-forward" size={16} color="#7a7a7a" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/terms')}
            className="flex-row items-center px-4 py-4 active:bg-white"
            style={{ borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}
          >
            <Ionicons name="document-text-outline" size={20} color="#1d1d1f" style={{ marginRight: 12 }} />
            <Text className="flex-1 text-[17px] text-[#1d1d1f]">이용약관</Text>
            <Ionicons name="chevron-forward" size={16} color="#7a7a7a" />
          </TouchableOpacity>

          <View className="flex-row items-center px-4 py-4">
            <Ionicons name="information-circle-outline" size={20} color="#1d1d1f" style={{ marginRight: 12 }} />
            <Text className="flex-1 text-[17px] text-[#1d1d1f]">앱 버전</Text>
            <Text className="text-[14px] text-[#7a7a7a]">{APP_VERSION}</Text>
          </View>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-[#ef4444] rounded-full py-3.5 items-center active:scale-95"
        >
          <Text className="text-white font-semibold text-[17px]">로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
