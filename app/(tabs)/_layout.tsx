import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: '알람' }} />
      <Tabs.Screen name="map" options={{ title: '지도' }} />
      <Tabs.Screen name="friends" options={{ title: '친구' }} />
    </Tabs>
  );
}
