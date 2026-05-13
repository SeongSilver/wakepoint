module.exports = {
  expo: {
    name: '다왔어',
    slug: 'wakepoint',
    scheme: 'wakepoint',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#4F46E5',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourname.wakepoint',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: '목적지 알람을 위해 위치가 필요합니다',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          '앱이 백그라운드에서도 위치를 추적하여 목적지 도착 알람을 울립니다',
        NSLocationAlwaysUsageDescription:
          '앱이 백그라운드에서도 위치를 추적하여 목적지 도착 알람을 울립니다',
        UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
      },
    },
    android: {
      package: 'com.yourname.wakepoint',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#4F46E5',
      },
      edgeToEdgeEnabled: true,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      config: {
        googleMaps: {
          // .env의 EXPO_PUBLIC_GOOGLE_MAPS_API_KEY 값이 빌드 시 주입됨
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            '앱이 백그라운드에서도 위치를 추적하여 목적지 도착 알람을 울립니다.',
        },
      ],
      [
        'expo-notifications',
        {
          color: '#4F46E5',
        },
      ],
    ],
    extra: {
      eas: {
        // eas build:configure 실행 시 자동으로 실제 ID로 교체됨
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
