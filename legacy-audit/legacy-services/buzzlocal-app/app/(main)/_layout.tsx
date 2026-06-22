import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function MainLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: SPACING.sm,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          tabBarLabel: 'Ask Buzz',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.askIcon}>
              <Ionicons name="chatbubbles" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarLabel: 'Society',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="safe"
        options={{
          tabBarLabel: 'REZ Safe',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vibe-map"
        options={{
          tabBarLabel: 'Vibe Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  askIcon: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 4,
  },
});
