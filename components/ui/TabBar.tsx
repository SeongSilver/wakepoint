import { View, Text, TouchableOpacity } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index:   { label: '알람', icon: 'alarm-outline',    iconActive: 'alarm' },
  map:     { label: '지도', icon: 'location-outline', iconActive: 'location-sharp' },
  friends: { label: '친구', icon: 'people-outline',   iconActive: 'people' },
};

// 스크린 콘텐츠의 paddingBottom 계산에 사용
export const TAB_BAR_HEIGHT = 72;

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 8,
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 8,
        paddingHorizontal: 4,
        height: TAB_BAR_HEIGHT,
        alignItems: 'center',
      }}
    >
      {state.routes.map((route, index) => {
        const cfg = TAB_CONFIG[route.name] ?? {
          label: route.name,
          icon: 'ellipse-outline',
          iconActive: 'ellipse',
        };
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.75}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            {/* 활성 탭 pill 배경 */}
            <View
              style={{
                backgroundColor: focused ? '#0066cc' : 'transparent',
                borderRadius: 12,
                width: 48,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 3,
              }}
            >
              <Ionicons
                name={focused ? cfg.iconActive : cfg.icon}
                size={20}
                color={focused ? '#ffffff' : '#7a7a7a'}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '600' : '400',
                color: focused ? '#0066cc' : '#7a7a7a',
                letterSpacing: -0.1,
              }}
            >
              {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
