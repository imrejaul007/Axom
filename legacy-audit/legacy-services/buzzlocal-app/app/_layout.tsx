import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store';
import { COLORS } from '@/constants/theme';

export default function RootLayout() {
  const { isLoading } = useAuthStore();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="create" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
