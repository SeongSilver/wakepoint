import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Keyboard,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shareTextTemplate } from '@react-native-kakao/share';
import type { KakaoTextTemplate } from '@react-native-kakao/share';
import { useFriends, FriendEntry } from '@/hooks/useFriends';
import {
  useAlarmPermissions,
  ReceivedPermissionRequest,
} from '@/hooks/useAlarmPermissions';
import { useUserStore } from '@/store/userStore';
import { UserProfile } from '@/types';

const STORE_URL = 'https://play.google.com/store/apps/details?id=com.yourname.wakepoint';

function getInitial(nickname: string) {
  return nickname.charAt(0).toUpperCase();
}

function PermissionBannerItem({
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

export default function FriendsScreen() {
  const profile = useUserStore((s) => s.profile);
  const {
    friends,
    loading,
    searching,
    adding,
    removingId,
    searchResult,
    searchError,
    fetchFriends,
    searchByEmail,
    clearSearch,
    addFriend,
    removeFriend,
    isAlreadyFriend,
  } = useFriends();

  const {
    receivedPending,
    respondingId,
    requestingId,
    fetchSentRequests,
    fetchReceivedPending,
    requestPermission,
    respondToRequest,
    getSentStatus,
  } = useAlarmPermissions();

  const [emailInput, setEmailInput] = useState('');
  const [inviting, setInviting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchFriends();
      fetchSentRequests();
      fetchReceivedPending();
    }
  }, [profile?.id, fetchFriends, fetchSentRequests, fetchReceivedPending]);

  const handleSearch = useCallback(() => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    searchByEmail(trimmed);
  }, [emailInput, searchByEmail]);

  const handleEmailChange = useCallback((text: string) => {
    setEmailInput(text);
    if (!text) clearSearch();
  }, [clearSearch]);

  const handleClearInput = useCallback(() => {
    setEmailInput('');
    clearSearch();
  }, [clearSearch]);

  const handleAddFriend = useCallback(async (target: UserProfile) => {
    try {
      await addFriend(target);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        Alert.alert('알림', '이미 친구 목록에 있는 사용자입니다');
      } else {
        Alert.alert('오류', '친구 추가에 실패했습니다');
      }
    }
  }, [addFriend]);

  const handleRequestPermission = useCallback(async (
    targetId: string,
    targetPushToken?: string,
  ) => {
    try {
      await requestPermission(targetId, targetPushToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        Alert.alert('알림', '이미 권한 요청을 보냈습니다');
      } else {
        Alert.alert('오류', '권한 요청에 실패했습니다');
      }
    }
  }, [requestPermission]);

  const handleRemoveFriend = useCallback((entry: FriendEntry) => {
    Alert.alert(
      '친구 삭제',
      `${entry.profile.nickname}님을 친구 목록에서 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(entry.rowId);
            } catch {
              Alert.alert('오류', '친구 삭제에 실패했습니다');
            }
          },
        },
      ]
    );
  }, [removeFriend]);

  const handleKakaoInvite = useCallback(async () => {
    if (!profile?.id) return;
    setInviting(true);
    try {
      const template: KakaoTextTemplate = {
        text: '다왔어 앱에서 같이 위치 알람 써봐!\n목적지에 가까워지면 알람이 울려요. 나를 친구 추가하면 대신 알람 설정도 해줄 수 있어요!',
        link: {
          androidExecutionParams: { from: profile.id },
          iosExecutionParams: { from: profile.id },
          mobileWebUrl: STORE_URL,
          webUrl: STORE_URL,
        },
        buttons: [
          {
            title: '앱 설치하기',
            link: { mobileWebUrl: STORE_URL, webUrl: STORE_URL },
          },
        ],
      };
      await shareTextTemplate({ template, useWebBrowserIfKakaoTalkNotAvailable: false });
    } catch {
      try {
        await Share.share({
          message: `다왔어 앱에서 같이 위치 알람 써봐!\n설치 링크: ${STORE_URL}`,
          title: '다왔어 앱 초대',
        });
      } catch {
        // 사용자가 공유 다이얼로그를 닫은 경우 무시
      }
    } finally {
      setInviting(false);
    }
  }, [profile?.id]);

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-parchment items-center justify-center px-8">
        <Ionicons name="person-circle-outline" size={64} color="#7a7a7a" />
        <Text className="text-[17px] font-semibold text-ink mt-4 text-center">
          로그인이 필요합니다
        </Text>
        <Text className="text-sm text-ink-muted mt-2 text-center">
          친구 기능을 사용하려면 먼저 로그인해 주세요
        </Text>
      </SafeAreaView>
    );
  }

  const renderFriendItem = ({ item }: { item: FriendEntry }) => {
    const permStatus = getSentStatus(item.profile.id);
    const isRequesting = requestingId === item.profile.id;

    return (
      <View className="bg-canvas border border-hairline rounded-[18px] px-4 py-3 mb-3">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-parchment items-center justify-center mr-3">
            <Text className="text-[17px] font-semibold text-primary">
              {getInitial(item.profile.nickname)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
              {item.profile.nickname}
            </Text>
            <Text className="text-[13px] text-ink-muted mt-0.5" numberOfLines={1}>
              {item.profile.email}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRemoveFriend(item)}
            disabled={removingId === item.rowId}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="ml-2 w-8 h-8 items-center justify-center active:opacity-60"
          >
            {removingId === item.rowId ? (
              <ActivityIndicator size="small" color="#7a7a7a" />
            ) : (
              <Ionicons name="person-remove-outline" size={20} color="#7a7a7a" />
            )}
          </TouchableOpacity>
        </View>

        {/* 알람 권한 요청 */}
        <View className="mt-2.5 pt-2.5 border-t border-hairline flex-row">
          {permStatus === null && (
            <TouchableOpacity
              onPress={() => handleRequestPermission(item.profile.id, item.profile.push_token)}
              disabled={isRequesting}
              className="flex-row items-center bg-parchment border border-hairline rounded-full px-3 py-1.5 active:scale-95"
            >
              {isRequesting ? (
                <ActivityIndicator size="small" color="#0066cc" />
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={13} color="#0066cc" />
                  <Text className="text-[12px] font-medium text-primary ml-1">알람 권한 요청</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {permStatus === 'pending' && (
            <View className="flex-row items-center bg-parchment border border-hairline rounded-full px-3 py-1.5">
              <Ionicons name="time-outline" size={13} color="#7a7a7a" />
              <Text className="text-[12px] font-medium text-ink-muted ml-1">요청 대기 중</Text>
            </View>
          )}
          {permStatus === 'accepted' && (
            <View className="flex-row items-center bg-parchment border border-hairline rounded-full px-3 py-1.5">
              <Ionicons name="checkmark-circle-outline" size={13} color="#22c55e" />
              <Text className="text-[12px] font-medium ml-1" style={{ color: '#22c55e' }}>
                권한 허용됨
              </Text>
            </View>
          )}
          {permStatus === 'rejected' && (
            <View className="flex-row items-center bg-parchment border border-hairline rounded-full px-3 py-1.5">
              <Ionicons name="close-circle-outline" size={13} color="#ef4444" />
              <Text className="text-[12px] font-medium text-danger ml-1">권한 거절됨</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = (
    <View>
      {/* 검색 카드 */}
      <View className="bg-canvas border border-hairline rounded-[18px] p-4 mb-5">
        <Text className="text-[15px] font-semibold text-ink mb-3">이메일로 친구 추가</Text>

        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-parchment rounded-full h-11 px-4">
            <TextInput
              ref={inputRef}
              value={emailInput}
              onChangeText={handleEmailChange}
              placeholder="친구 이메일 입력"
              placeholderTextColor="#7a7a7a"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              className="flex-1 text-[15px] text-ink"
              style={{ paddingVertical: 0 }}
            />
            {emailInput.length > 0 && (
              <TouchableOpacity
                onPress={handleClearInput}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="ml-1"
              >
                <Ionicons name="close-circle" size={16} color="#7a7a7a" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSearch}
            disabled={searching || !emailInput.trim()}
            className={`h-11 px-5 rounded-full items-center justify-center active:scale-95 ${
              emailInput.trim() ? 'bg-primary' : 'bg-hairline'
            }`}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className={`text-[15px] font-semibold ${
                  emailInput.trim() ? 'text-white' : 'text-ink-muted'
                }`}
              >
                검색
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {searchError && (
          <View className="mt-3 py-2 px-1">
            <Text className="text-[13px] text-ink-muted text-center">{searchError}</Text>
          </View>
        )}

        {searchResult && (
          <View className="mt-3 flex-row items-center bg-parchment rounded-xl p-3">
            <View className="w-10 h-10 rounded-full bg-canvas border border-hairline items-center justify-center mr-3">
              <Text className="text-[15px] font-semibold text-primary">
                {getInitial(searchResult.nickname)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
                {searchResult.nickname}
              </Text>
              <Text className="text-[13px] text-ink-muted mt-0.5" numberOfLines={1}>
                {searchResult.email}
              </Text>
            </View>
            {isAlreadyFriend(searchResult.id) ? (
              <View className="px-3 py-1.5 rounded-full border border-hairline">
                <Text className="text-[13px] text-ink-muted font-medium">추가됨</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleAddFriend(searchResult)}
                disabled={adding}
                className="bg-primary px-4 py-1.5 rounded-full items-center justify-center active:scale-95"
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-[13px] text-white font-semibold">추가</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* 친구 목록 헤더 */}
      <View className="flex-row items-center mb-3">
        <Text className="text-[15px] font-semibold text-ink flex-1">
          내 친구{' '}
          {friends.length > 0 && (
            <Text className="font-normal text-ink-muted">{friends.length}명</Text>
          )}
        </Text>
        {loading && <ActivityIndicator size="small" color="#0066cc" />}
      </View>
    </View>
  );

  const ListEmpty = !loading ? (
    <View className="items-center py-12 px-8">
      <View className="w-20 h-20 rounded-full bg-canvas border border-hairline items-center justify-center mb-4">
        <Ionicons name="people-outline" size={36} color="#7a7a7a" />
      </View>
      <Text className="text-[17px] font-semibold text-ink text-center">친구가 없습니다</Text>
      <Text className="text-[14px] text-ink-muted mt-2 text-center leading-5">
        카카오톡으로 초대하거나{'\n'}이메일로 친구를 추가해보세요
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView className="flex-1 bg-parchment" edges={['top']}>
      {/* 헤더 */}
      <View className="px-5 pt-2 pb-4">
        <Text className="text-[28px] font-semibold text-ink">친구</Text>
      </View>

      {/* 수신된 알람 권한 요청 배너 */}
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
              <PermissionBannerItem
                request={req}
                responding={respondingId === req.id}
                onRespond={respondToRequest}
              />
            </View>
          ))}
        </View>
      )}

      {/* 친구 목록 */}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.rowId}
        renderItem={renderFriendItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
      />

      {/* 카카오톡 초대 버튼 (하단 고정) */}
      <View
        className="px-5 py-3 bg-parchment border-t border-hairline"
      >
        <TouchableOpacity
          onPress={handleKakaoInvite}
          disabled={inviting}
          className={`flex-row items-center justify-center bg-kakao rounded-full py-3.5 active:scale-95 ${inviting ? 'opacity-60' : ''}`}
        >
          {inviting ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Text className="text-lg mr-2">💬</Text>
              <Text className="text-black font-semibold text-[17px]">카카오톡으로 초대</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
