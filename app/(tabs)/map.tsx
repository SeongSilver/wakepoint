import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Circle, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useAlarmStore } from '@/store/alarmStore';
import { useUserStore } from '@/store/userStore';
import { validateRadius, formatDistance } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { Alarm } from '@/types';

// 반경 프리셋 (km 단위)
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

const BOTTOM_PANEL_HEIGHT = 360;
const SEOUL_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;

  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [radiusKm, setRadiusKm] = useState(0.5);
  const [label, setLabel] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const profile = useUserStore((s) => s.profile);

  // 패널 열기/닫기 애니메이션
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
    });
  }, [panelAnim]);

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BOTTOM_PANEL_HEIGHT, 0],
  });

  // 지도 탭 → 역지오코딩 + 패널 표시
  const handleMapPress = useCallback(async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    Keyboard.dismiss();

    setGeocoding(true);
    // 즉시 좌표로 패널 표시 (주소는 비동기 업데이트)
    setSelected({ latitude, longitude, address: '주소 불러오는 중...' });
    showPanel();

    // 선택 위치 중심으로 지도 이동
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
  }, [showPanel]);

  // 현재 위치로 이동
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

  // 알람 저장
  const handleSave = useCallback(async () => {
    if (!selected) return;

    if (!validateRadius(radiusKm)) {
      Alert.alert('반경 오류', '반경은 100m ~ 50km 사이여야 합니다.');
      return;
    }

    const alarmLabel = label.trim() || selected.address;
    const now = new Date().toISOString();

    setSaving(true);
    try {
      const userId = profile?.id ?? 'local';

      // Supabase에 저장 (로그인 시)
      if (profile?.id) {
        const { data, error } = await supabase
          .from('alarms')
          .insert({
            owner_id: userId,
            created_by: userId,
            label: alarmLabel,
            target_lat: selected.latitude,
            target_lng: selected.longitude,
            target_address: selected.address,
            radius_km: radiusKm,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        addAlarm(data as Alarm);
      } else {
        // 비로그인: 로컬 스토어에만 저장
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
        };
        addAlarm(localAlarm);
      }

      hidePanel();
      Alert.alert(
        '알람 설정 완료',
        `"${alarmLabel}" 알람이 설정되었습니다.\n목적지 반경 ${formatDistance(radiusKm)} 이내 진입 시 알림을 드립니다.`,
        [{ text: '확인', onPress: () => router.push('/(tabs)') }]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '저장에 실패했습니다.';
      Alert.alert('저장 실패', msg);
    } finally {
      setSaving(false);
    }
  }, [selected, radiusKm, label, profile, addAlarm, hidePanel]);

  return (
    <View style={{ flex: 1 }}>
      {/* 지도 */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={SEOUL_REGION}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {selected && (
          <>
            <Marker
              coordinate={{ latitude: selected.latitude, longitude: selected.longitude }}
              pinColor="#4F46E5"
            />
            <Circle
              center={{ latitude: selected.latitude, longitude: selected.longitude }}
              radius={radiusKm * 1000}
              strokeColor="#4F46E5"
              strokeWidth={2}
              fillColor="rgba(79, 70, 229, 0.12)"
            />
          </>
        )}
      </MapView>

      {/* 탭 안내 (핀 없을 때) */}
      {!panelVisible && (
        <View
          style={{
            position: 'absolute',
            top: 60,
            alignSelf: 'center',
            backgroundColor: 'rgba(17,24,39,0.78)',
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 24,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
            📍 지도를 탭해서 목적지를 설정하세요
          </Text>
        </View>
      )}

      {/* 내 위치 버튼 */}
      <TouchableOpacity
        onPress={handleMyLocation}
        style={{
          position: 'absolute',
          top: 116,
          right: 16,
          width: 44,
          height: 44,
          backgroundColor: '#fff',
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 4,
        }}
      >
        <Text style={{ fontSize: 20 }}>◎</Text>
      </TouchableOpacity>

      {/* 바텀 패널 */}
      {panelVisible && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        >
          <Animated.View
            style={{
              transform: [{ translateY: panelTranslateY }],
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              elevation: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            }}
          >
            {/* 드래그 핸들 */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            >
              {/* 헤더 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                  알람 설정
                </Text>
                <TouchableOpacity onPress={hidePanel} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 20, color: '#9CA3AF' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 주소 */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>목적지</Text>
                  {geocoding ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }} numberOfLines={2}>
                      {selected?.address}
                    </Text>
                  )}
                </View>
              </View>

              {/* 알람 이름 */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  알람 이름 <Text style={{ fontWeight: '400', color: '#9CA3AF' }}>(선택)</Text>
                </Text>
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="예: 회사, 집, 강남역"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: '#111827',
                    backgroundColor: '#fff',
                  }}
                />
              </View>

              {/* 반경 선택 */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                    알람 반경
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#4F46E5' }}>
                    {formatDistance(radiusKm)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {RADIUS_PRESETS.map((preset) => {
                    const active = radiusKm === preset.value;
                    return (
                      <TouchableOpacity
                        key={preset.value}
                        onPress={() => setRadiusKm(preset.value)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 20,
                          borderWidth: active ? 0 : 1,
                          borderColor: '#E5E7EB',
                          backgroundColor: active ? '#4F46E5' : '#F9FAFB',
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: active ? '600' : '400',
                          color: active ? '#fff' : '#6B7280',
                        }}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 저장 버튼 */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || geocoding}
                style={{
                  backgroundColor: saving || geocoding ? '#A5B4FC' : '#4F46E5',
                  borderRadius: 9999,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    알람 저장하기
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
