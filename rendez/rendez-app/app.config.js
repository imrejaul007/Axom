module.exports = {
  expo: {
    name: 'Rendez',
    slug: 'rendez',
    version: '1.1.0',
    runtimeVersion: { policy: 'appVersion' },
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'rendez',              // enables rendez:// deep links
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#1a1a2e',
    },
    assetBundlePatterns: ['assets/**/*'],
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/icon.png',
      name: 'Rendez',
      shortName: 'Rendez',
      description: 'Real connections, not just swipes.',
      themeColor: '#7c3aed',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: 'com.rendez.app',
      buildNumber: '1',
      supportsTablet: false,
      requireFullScreen: true,
      associatedDomains: ['applinks:rendez.in'],  // universal links
      infoPlist: {
        NSCameraUsageDescription: 'Rendez needs camera access to take profile photos',
        NSPhotoLibraryUsageDescription: 'Rendez needs photo library access to upload profile photos',
        NSLocationWhenInUseUsageDescription: 'Rendez uses your location to show nearby people and merchants',
        LSApplicationQueriesSchemes: ['rendez'],
        ITSAppUsesNonExemptEncryption: false,     // no custom crypto — App Store compliance
      },
    },
    android: {
      package: 'com.rendez.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1a1a2e',
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            { scheme: 'https', host: 'rendez.in', pathPrefix: '/match' },
            { scheme: 'https', host: 'rendez.in', pathPrefix: '/gift' },
            { scheme: 'rendez' },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
      ],
      googleServicesFile: './google-services.json',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#7c3aed',
          defaultChannel: 'default',
          sounds: ['./assets/notification.wav'],
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Rendez uses your location to show nearby people and merchants',
        },
      ],
    ],
    extra: {
      eas: { projectId: 'YOUR_EAS_PROJECT_ID' },
      privacyPolicyUrl: 'https://rendez.in/privacy',
      termsUrl: 'https://rendez.in/terms',
      supportEmail: 'support@rendez.in',
    },
    updates: {
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/YOUR_EAS_PROJECT_ID',
    },
  },
};
