import { Tabs } from 'expo-router';
import TabBar from '@/components/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: '지도' }} />
      <Tabs.Screen name="alarms" options={{ title: '알람' }} />
      <Tabs.Screen name="friends" options={{ title: '친구' }} />
      <Tabs.Screen name="profile" options={{ title: '마이페이지' }} />
    </Tabs>
  );
}
