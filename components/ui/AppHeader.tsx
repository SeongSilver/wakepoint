import { View, Image } from 'react-native';

interface AppHeaderProps {
  children?: React.ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-parchment">
      <Image
        source={require('@/assets/images/logo-basic.png')}
        style={{ width: 180, height: 44 }}
        resizeMode="contain"
      />
      {children}
    </View>
  );
}
