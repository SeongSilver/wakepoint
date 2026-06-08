import { useState, useRef, useCallback, Fragment } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecording } from '@/hooks/useRecording';
import MapView, { Marker, Circle, Callout, MapPressEvent, PoiClickEvent, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, Tabs } from 'expo-router';
import { useAlarmStore } from '@/store/alarmStore';
import { useUserStore } from '@/store/userStore';
import { useAlarmPermissions } from '@/hooks/useAlarmPermissions';
import { validateRadius, formatDistance } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { sendFcmToUser } from '@/lib/firebase';
import { Alarm, UserProfile } from '@/types';

const KAKAO_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

const RADIUS_PRESETS = [
  { label: '300m', value: 0.3 },
  { label: '500m', value: 0.5 },
  { label: '1km',  value: 1 },
  { label: '2km',  value: 2 },
  { label: '5km',  value: 5 },
  { label: '10km', value: 10 },
  { label: '20km', value: 20 },
  { label: '50km', value: 50 },
];

const BOTTOM_PANEL_HEIGHT = 720;
const SEOUL_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const ALARM_MARKER = require('../../assets/images/icon-point.png');

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface KakaoPlace {
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string; // longitude
  y: string; // latitude
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const SEARCH_TOP = insets.top + 16;

  const mapRef = useRef<MapView>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [radiusKm, setRadiusKm] = useState(0.5);
  const [label, setLabel] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [isForFriend, setIsForFriend] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [soundType, setSoundType] = useState<'default' | 'custom'>('default');

  const {
    isRecording,
    recordingUri,
    isPlaying,
    durationSec,
    startRecording,
    stopRecording,
    playPreview,
    uploadRecording,
    clearRecording,
  } = useRecording();

  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const activeAlarms = useAlarmStore((s) => s.activeAlarms);
  const profile = useUserStore((s) => s.profile);

  const { acceptedFriends, loadingAccepted, fetchAcceptedFriends } = useAlarmPermissions();

  const showPanel = useCallback(() => {
    setPanelVisible(true);
    Animated.spring(panelAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [panelAnim]);

  const hidePanel = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setPanelVisible(false);
      setSelected(null);
      setLabel('');
      setRadiusKm(0.5);
      setIsForFriend(false);
      setSelectedFriend(null);
      setSoundType('default');
      clearRecording();
    });
  }, [panelAnim, clearRecording]);

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BOTTOM_PANEL_HEIGHT, 0],
  });

  const searchKakao = useCallback((query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=7`,
          { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } }
        );
        const data = await res.json();
        setSearchResults((data.documents as KakaoPlace[]) ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    searchKakao(text);
  }, [searchKakao]);

  const clearSearch = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchText('');
    setSearchResults([]);
    setIsSearchFocused(false);
    setIsSearching(false);
    Keyboard.dismiss();
  }, []);

  const handleSelectPlace = useCallback((place: KakaoPlace) => {
    const latitude = parseFloat(place.y);
    const longitude = parseFloat(place.x);
    const roadAddr = place.road_address_name || place.address_name;
    const address = place.place_name ? `${place.place_name}, ${roadAddr}` : roadAddr;

    clearSearch();

    setSelected({ latitude, longitude, address });
    showPanel();

    mapRef.current?.animateToRegion(
      { latitude: latitude - 0.018, longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 },
      400
    );
  }, [showPanel, clearSearch]);

  const handleMapPress = useCallback(async (e: MapPressEvent) => {
    if (isSearchFocused) {
      clearSearch();
      return;
    }

    const { latitude, longitude } = e.nativeEvent.coordinate;
    Keyboard.dismiss();

    setGeocoding(true);
    setSelected({ latitude, longitude, address: '주소 불러오는 중...' });
    showPanel();

    mapRef.current?.animateToRegion(
      { latitude: latitude - 0.018, longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 },
      400
    );

    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = result
        ? [result.street, result.district, result.city]
            .filter(Boolean)
            .join(', ') || result.formattedAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      setSelected({ latitude, longitude, address });
    } catch {
      setSelected({ latitude, longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
    } finally {
      setGeocoding(false);
    }
  }, [showPanel, isSearchFocused, clearSearch]);

  const handlePoiClick = useCallback(async (e: PoiClickEvent) => {
    if (isSearchFocused) {
      clearSearch();
      return;
    }

    const { coordinate, name } = e.nativeEvent;
    const { latitude, longitude } = coordinate;
    Keyboard.dismiss();

    setGeocoding(true);
    setSelected({ latitude, longitude, address: '주소 불러오는 중...' });
    setLabel(name);
    showPanel();

    mapRef.current?.animateToRegion(
      { latitude: latitude - 0.018, longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 },
      400
    );

    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = result
        ? [result.street, result.district, result.city]
            .filter(Boolean)
            .join(', ') || result.formattedAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      setSelected({ latitude, longitude, address });
    } catch {
      setSelected({ latitude, longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
    } finally {
      setGeocoding(false);
    }
  }, [showPanel, isSearchFocused, clearSearch]);

  const handleMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 권한을 허용해주세요.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 600);
    } catch {
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selected) return;

    if (!validateRadius(radiusKm)) {
      Alert.alert('반경 오류', '반경은 100m ~ 50km 사이여야 합니다.');
      return;
    }

    if (isForFriend && !selectedFriend) {
      Alert.alert('친구 선택', '알람을 받을 친구를 선택해주세요.');
      return;
    }

    const alarmLabel = label.trim() || selected.address;
    const now = new Date().toISOString();

    setSaving(true);
    let uploadedSoundUri: string | undefined;
    if (soundType === 'custom' && recordingUri && profile?.id) {
      uploadedSoundUri = (await uploadRecording(profile.id)) ?? undefined;
      if (!uploadedSoundUri) {
        Alert.alert('업로드 실패', '녹음 파일 업로드에 실패했습니다. 다시 시도해주세요.');
        setSaving(false);
        return;
      }
    }

    try {
      const userId = profile?.id ?? 'local';
      const ownerId = isForFriend && selectedFriend ? selectedFriend.id : userId;

      if (profile?.id) {
        const { data, error } = await supabase
          .from('alarms')
          .insert({
            owner_id: ownerId,
            created_by: userId,
            label: alarmLabel,
            target_lat: selected.latitude,
            target_lng: selected.longitude,
            target_address: selected.address,
            radius_km: radiusKm,
            is_active: true,
            sound_type: soundType,
            sound_uri: uploadedSoundUri ?? null,
          })
          .select()
          .single();

        if (error) throw error;

        if (!isForFriend) {
          addAlarm(data as Alarm);
        } else if (selectedFriend?.push_token && profile?.nickname) {
          sendFcmToUser(selectedFriend.push_token, {
            title: '알람이 설정됐어요 📍',
            body: `${profile.nickname}님이 알람을 설정해줬어요`,
          }).catch(() => {});
        }
      } else {
        const localAlarm: Alarm = {
          id: `local-${Date.now()}`,
          owner_id: 'local',
          created_by: 'local',
          label: alarmLabel,
          target_lat: selected.latitude,
          target_lng: selected.longitude,
          target_address: selected.address,
          radius_km: radiusKm,
          is_active: true,
          created_at: now,
          sound_type: soundType,
          sound_uri: uploadedSoundUri,
        };
        addAlarm(localAlarm);
      }

      hidePanel();

      const successBody = isForFriend && selectedFriend
        ? `"${alarmLabel}" 알람을 ${selectedFriend.nickname}님을 위해 설정했습니다.\n목적지 반경 ${formatDistance(radiusKm)} 이내 진입 시 알림을 드립니다.`
        : `"${alarmLabel}" 알람이 설정되었습니다.\n목적지 반경 ${formatDistance(radiusKm)} 이내 진입 시 알림을 드립니다.`;

      Alert.alert('알람 설정 완료', successBody,
        [{ text: '확인', onPress: () => router.push('/(tabs)/alarms') }]
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? '저장에 실패했습니다.';
      Alert.alert('저장 실패', msg);
    } finally {
      setSaving(false);
    }
  }, [selected, radiusKm, label, profile, addAlarm, hidePanel, isForFriend, selectedFriend, soundType, recordingUri, uploadRecording]);

  const showDropdown = isSearchFocused && searchText.trim().length > 0;

  return (
    <View className="flex-1">
      <Tabs.Screen options={{ tabBarStyle: panelVisible ? { display: 'none' } : undefined }} />
      {/* 지도 */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={SEOUL_REGION}
        onPress={handleMapPress}
        onPoiClick={handlePoiClick}
        showsUserLocation={activeAlarms.length > 0}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* 활성 알람 마커 */}
        {activeAlarms.map((alarm) => (
          <Fragment key={alarm.id}>
            <Marker
              coordinate={{ latitude: alarm.target_lat, longitude: alarm.target_lng }}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1.0 }}
              zIndex={1}
            >
              <Image
                source={ALARM_MARKER}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
              <Callout>
                <View className="bg-white rounded-xl border border-[#e0e0e0] p-2" style={{ minWidth: 140 }}>
                  <Text className="text-[14px] font-semibold text-[#1d1d1f] mb-0.5">
                    {alarm.label}
                  </Text>
                  <Text className="text-[12px] font-semibold text-[#0066cc]">
                    {formatDistance(alarm.radius_km)}
                  </Text>
                </View>
              </Callout>
            </Marker>
            <Circle
              center={{ latitude: alarm.target_lat, longitude: alarm.target_lng }}
              radius={alarm.radius_km * 1000}
              strokeColor="rgba(0,102,204,0.9)"
              strokeWidth={2.5}
              fillColor="rgba(0,102,204,0.15)"
            />
          </Fragment>
        ))}

        {/* 새로 선택한 위치 마커 */}
        {selected && (
          <>
            <Marker
              coordinate={{ latitude: selected.latitude, longitude: selected.longitude }}
              pinColor="#0066cc"
            />
            <Circle
              center={{ latitude: selected.latitude, longitude: selected.longitude }}
              radius={radiusKm * 1000}
              strokeColor="rgba(0,102,204,0.9)"
              strokeWidth={2.5}
              fillColor="rgba(0,102,204,0.15)"
            />
          </>
        )}
      </MapView>

      {/* 검색창 */}
      <View className="absolute left-3 right-3" style={{ top: SEARCH_TOP }}>
        <View
          className="flex-row items-center bg-white rounded-full px-4"
          style={{
            height: 44,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
          }}
        >
          <Ionicons name="search" size={18} color="#7a7a7a" style={{ marginRight: 8 }} />
          <TextInput
            ref={searchInputRef}
            value={searchText}
            onChangeText={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="장소 검색"
            placeholderTextColor="#7a7a7a"
            returnKeyType="search"
            className="flex-1 text-[17px] text-ink"
            style={{ paddingVertical: 0 }}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#0066cc" style={{ marginLeft: 6 }} />
          )}
          {searchText.length > 0 && !isSearching && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#7a7a7a" />
            </TouchableOpacity>
          )}
        </View>

        {/* 검색 결과 드롭다운 */}
        {showDropdown && (
          <View
            className="mt-2 bg-white overflow-hidden"
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#e0e0e0',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            }}
          >
            {searchResults.length === 0 && !isSearching ? (
              <View className="py-4 items-center">
                <Text className="text-sm text-ink-muted">검색 결과가 없습니다</Text>
              </View>
            ) : (
              searchResults.map((place, index) => (
                <TouchableOpacity
                  key={`${place.place_name}-${index}`}
                  onPress={() => handleSelectPlace(place)}
                  className="px-4 py-3 active:bg-parchment"
                  style={
                    index < searchResults.length - 1
                      ? { borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }
                      : undefined
                  }
                >
                  <Text className="text-[15px] font-medium text-ink" numberOfLines={1}>
                    {place.place_name}
                  </Text>
                  <Text className="text-[13px] text-ink-muted mt-0.5" numberOfLines={1}>
                    {place.road_address_name || place.address_name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      {/* 탭 안내 */}
      {/* 내 위치 버튼 */}
      <TouchableOpacity
        onPress={handleMyLocation}
        className="absolute right-4 w-11 h-11 rounded-full items-center justify-center"
        style={{
          top: SEARCH_TOP + 56,
          backgroundColor: 'rgba(210,210,215,0.64)',
        }}
      >
        <Ionicons name="navigate" size={20} color="#0066cc" />
      </TouchableOpacity>

      {/* 바텀 패널 */}
      {panelVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="absolute bottom-0 left-0 right-0"
        >
          <Animated.View
            className="bg-canvas rounded-t-3xl"
            style={{
              transform: [{ translateY: panelTranslateY }],
              elevation: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            }}
          >
            {/* 드래그 핸들 */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-hairline" />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            >
              {/* 헤더 */}
              <View className="flex-row items-center justify-between mb-4 mt-1">
                <Text className="text-lg font-semibold text-ink">알람 설정</Text>
                <TouchableOpacity onPress={hidePanel} className="p-1">
                  <Ionicons name="close" size={22} color="#7a7a7a" />
                </TouchableOpacity>
              </View>

              {/* 누구를 위한 알람인지 선택 (로그인 시만 표시) */}
              {profile && (
                <View className="mb-4">
                  <View className="flex-row bg-parchment rounded-full p-1">
                    <TouchableOpacity
                      onPress={() => { setIsForFriend(false); setSelectedFriend(null); }}
                      className={`flex-1 py-2 rounded-full items-center ${!isForFriend ? 'bg-canvas' : ''}`}
                      style={!isForFriend ? { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } : undefined}
                    >
                      <Text className={`text-[14px] font-medium ${!isForFriend ? 'text-ink' : 'text-ink-muted'}`}>
                        내 알람
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setIsForFriend(true);
                        setSelectedFriend(null);
                        fetchAcceptedFriends();
                      }}
                      className={`flex-1 py-2 rounded-full items-center ${isForFriend ? 'bg-canvas' : ''}`}
                      style={isForFriend ? { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } : undefined}
                    >
                      <Text className={`text-[14px] font-medium ${isForFriend ? 'text-ink' : 'text-ink-muted'}`}>
                        친구 알람
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 친구 선택 목록 */}
                  {isForFriend && (
                    <View className="mt-3">
                      {loadingAccepted ? (
                        <View className="py-4 items-center">
                          <ActivityIndicator color="#0066cc" />
                        </View>
                      ) : acceptedFriends.length === 0 ? (
                        <View className="bg-parchment border border-hairline rounded-[18px] p-4">
                          <Text className="text-[13px] text-ink-muted text-center leading-5">
                            알람 권한을 수락한 친구가 없습니다{'\n'}친구 화면에서 먼저 권한을 요청하세요
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-parchment border border-hairline rounded-[18px] overflow-hidden">
                          {acceptedFriends.map((friend, index) => (
                            <TouchableOpacity
                              key={friend.profile.id}
                              onPress={() => setSelectedFriend(friend.profile)}
                              className="flex-row items-center px-4 py-3 active:bg-hairline"
                              style={index < acceptedFriends.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#e0e0e0' } : undefined}
                            >
                              <View className="w-8 h-8 rounded-full bg-canvas border border-hairline items-center justify-center mr-3">
                                <Text className="text-[13px] font-semibold text-primary">
                                  {friend.profile.nickname.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <Text className="text-[15px] text-ink flex-1" numberOfLines={1}>
                                {friend.profile.nickname}
                              </Text>
                              {selectedFriend?.id === friend.profile.id && (
                                <Ionicons name="checkmark-circle" size={20} color="#0066cc" />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* 주소 */}
              <View className="flex-row items-start bg-parchment rounded-[18px] p-3 mb-4">
                <Ionicons
                  name="location-sharp"
                  size={18}
                  color="#0066cc"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <View className="flex-1">
                  <Text className="text-xs text-ink-muted mb-0.5">목적지</Text>
                  {geocoding ? (
                    <ActivityIndicator size="small" color="#0066cc" />
                  ) : (
                    <Text className="text-sm text-ink font-medium" numberOfLines={2}>
                      {selected?.address}
                    </Text>
                  )}
                </View>
              </View>

              {/* 알람 이름 */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-ink mb-2">
                  알람 이름{' '}
                  <Text className="font-normal text-ink-muted">(선택)</Text>
                </Text>
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="예: 회사, 집, 강남역"
                  placeholderTextColor="#7a7a7a"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  className="bg-parchment border border-hairline rounded-[18px] px-4 py-3 text-[17px] text-ink"
                />
              </View>

              {/* 반경 선택 */}
              <View className="mb-5">
                <View className="flex-row justify-between mb-2.5">
                  <Text className="text-sm font-semibold text-ink">알람 반경</Text>
                  <Text className="text-sm font-semibold text-primary">{formatDistance(radiusKm)}</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {RADIUS_PRESETS.map((preset) => {
                    const active = radiusKm === preset.value;
                    return (
                      <TouchableOpacity
                        key={preset.value}
                        onPress={() => setRadiusKm(preset.value)}
                        className={`px-3.5 py-1.5 rounded-full active:scale-95 ${
                          active ? 'bg-primary' : 'bg-parchment border border-hairline'
                        }`}
                      >
                        <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-ink-muted'}`}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 알람음 설정 */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-ink mb-2">알람음</Text>
                <View className="flex-row bg-parchment rounded-full p-1 mb-3">
                  <TouchableOpacity
                    onPress={() => { setSoundType('default'); clearRecording(); }}
                    className={`flex-1 py-2 rounded-full items-center ${soundType === 'default' ? 'bg-canvas' : ''}`}
                    style={soundType === 'default' ? { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } : undefined}
                  >
                    <Text className={`text-[14px] font-medium ${soundType === 'default' ? 'text-ink' : 'text-ink-muted'}`}>
                      기본 알람음
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSoundType('custom')}
                    className={`flex-1 py-2 rounded-full items-center ${soundType === 'custom' ? 'bg-canvas' : ''}`}
                    style={soundType === 'custom' ? { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } : undefined}
                  >
                    <Text className={`text-[14px] font-medium ${soundType === 'custom' ? 'text-ink' : 'text-ink-muted'}`}>
                      내 목소리로 녹음
                    </Text>
                  </TouchableOpacity>
                </View>

                {soundType === 'custom' && (
                  <View className="bg-parchment border border-hairline rounded-[18px] p-4">
                    {!recordingUri ? (
                      <View className="items-center">
                        <Pressable
                          onPressIn={startRecording}
                          onPressOut={stopRecording}
                          style={({ pressed }) => ({
                            width: 72,
                            height: 72,
                            borderRadius: 36,
                            backgroundColor: isRecording ? '#EF4444' : '#0066cc',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 10,
                            opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <Ionicons
                            name={isRecording ? 'stop' : 'mic'}
                            size={32}
                            color="#fff"
                          />
                        </Pressable>
                        <Text className="text-[13px] text-ink-muted text-center leading-5">
                          {isRecording
                            ? '녹음 중... 버튼에서 손 떼면 저장'
                            : '버튼을 누르는 동안 녹음됩니다'}
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <Ionicons name="musical-notes" size={20} color="#0066cc" />
                          <Text className="ml-2 text-sm text-ink font-medium">
                            녹음 완료 ({durationSec}초)
                          </Text>
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={playPreview}
                            className="w-9 h-9 rounded-full bg-canvas border border-hairline items-center justify-center active:scale-95"
                          >
                            <Ionicons
                              name={isPlaying ? 'pause' : 'play'}
                              size={18}
                              color="#0066cc"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => clearRecording()}
                            className="w-9 h-9 rounded-full bg-canvas border border-hairline items-center justify-center active:scale-95"
                          >
                            <Ionicons name="refresh" size={18} color="#7a7a7a" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* 저장 버튼 */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || geocoding || (isForFriend && !selectedFriend) || (soundType === 'custom' && !recordingUri)}
                className={`rounded-full py-3.5 items-center active:scale-95 ${
                  saving || geocoding || (isForFriend && !selectedFriend) || (soundType === 'custom' && !recordingUri) ? 'bg-primary/50' : 'bg-primary'
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-[17px] font-semibold">알람 저장하기</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
