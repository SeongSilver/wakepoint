module.exports = {
  expo: {
    name: '다왔어',
    slug: 'wakepoint',
    scheme: ['dawasseo', 'wakepoint'],
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo-vertical.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/images/logo-vertical.png',
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
        foregroundImage: './assets/images/logo-vertical.png',
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
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      intentFilters: [
        {
          // dawasseo:// 스킴 전체를 처리 — 카카오 초대 딥링크 포함
          action: 'VIEW',
          autoVerify: false,
          data: [{ scheme: 'dawasseo' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          // wakepoint:// 스킴 (Google OAuth 콜백 등 보조 스킴)
          action: 'VIEW',
          autoVerify: false,
          data: [{ scheme: 'wakepoint' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/images/favicon.ico',
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
          color: '#0066cc',
        },
      ],
      [
        '@react-native-kakao/core',
        {
          nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
          android: {
            authCodeHandlerActivity: true,
            extraMavenRepos: [
              'https://devrepo.kakao.com/nexus/content/groups/public/',
            ],
          },
          ios: {
            handleKakaoOpenUrl: true,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'cd812aa7-22b5-44c5-ad17-fbc7c9df77d6',
      },
    },
  },
};
