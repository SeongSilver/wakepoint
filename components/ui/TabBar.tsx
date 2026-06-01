import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index:   { label: '지도',     icon: 'map-outline',           iconActive: 'map' },
  alarms:  { label: '알람',     icon: 'alarm-outline',         iconActive: 'alarm' },
  friends: { label: '친구',     icon: 'people-outline',        iconActive: 'people' },
  profile: { label: '마이페이지', icon: 'person-circle-outline', iconActive: 'person-circle' },
};

// 스크린 콘텐츠의 paddingBottom 계산에 사용
export const TAB_BAR_HEIGHT = 80;

export default function TabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const tabBarStyle = focusedOptions.tabBarStyle as ViewStyle | undefined;
  if (tabBarStyle?.display === 'none') return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        backgroundColor: '#000000',
        paddingVertical: 8,
        paddingHorizontal: 4,
        paddingBottom: insets.bottom + 8,
        height: TAB_BAR_HEIGHT + insets.bottom,
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
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
          >
              <Ionicons
                name={focused ? cfg.iconActive : cfg.icon}
                size={26}
                color={focused ? '#818cf8' : '#6b7280'}
                style={{ marginBottom: 5 }}
              />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '400',
                color: focused ? '#818cf8' : '#6b7280',
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
