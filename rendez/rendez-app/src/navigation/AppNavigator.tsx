import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { useDeepLink } from '../hooks/useDeepLink';
import { ErrorBoundary } from '../components/ErrorBoundary';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import GiftPickerScreen from '../screens/GiftPickerScreen';
import GiftInboxScreen from '../screens/GiftInboxScreen';
import MeetupScreen from '../screens/MeetupScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VoucherScreen from '../screens/VoucherScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Plans feature screens
import PlansScreen from '../screens/PlansScreen';
import CreatePlanScreen from '../screens/CreatePlanScreen';
import PlanDetailScreen from '../screens/PlanDetailScreen';
import ApplicantsScreen from '../screens/ApplicantsScreen';
import MyPlansScreen from '../screens/MyPlansScreen';
import PlanConfirmScreen from '../screens/PlanConfirmScreen';

// Safety feature screens
import RequestInboxScreen from '../screens/RequestInboxScreen';

// Experience credits feature screens
import ExperienceWalletScreen from '../screens/ExperienceWalletScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

// RD-M-07 FIX: Define RootStackParamList to provide type-safe navigation params.
// Previously all route.params used unsafe `as` casts (e.g. `as { matchName: string }`).
// Using typed navigation eliminates runtime errors from mismatched param shapes.
export type RootStackParamList = {
  // Auth
  Login: undefined;
  ProfileSetup: undefined;
  // Main tabs (handled by MainTabs below)
  Main: undefined;
  // Chat
  Chat: { matchId: string; matchName: string; matchPartnerId?: string };
  // Gifts
  GiftPicker: { matchId: string; receiverName: string; receiverId: string };
  // Meetup
  Meetup: { matchId: string; matchName: string };
  Voucher: { bookingId: string; merchantName: string };
  // Profile
  ProfileDetail: { profileId: string };
  ProfileEdit: undefined;
  Settings: undefined;
  // Plans
  CreatePlan: undefined;
  PlanDetail: { planId: string };
  Applicants: { planId: string };
  MyPlans: undefined;
  PlanConfirm: { planId: string; bookingId: string };
  // Safety
  RequestInbox: undefined;
  // Experience
  ExperienceWallet: undefined;
};

const TAB_ICONS: Record<string, string> = {
  Discover: '🔍', Matches: '💜', Plans: '📅', Gifts: '🎁', Profile: '👤',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name] || '•'}</Text>,
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#bbb',
        tabBarStyle: { borderTopColor: '#f0e6ff', borderTopWidth: 1 },
        headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Matches"  component={MatchesScreen} />
      <Tab.Screen name="Plans"    component={PlansScreen}   options={{ title: 'Plans' }} />
      <Tab.Screen name="Gifts"    component={GiftInboxScreen} options={{ title: 'Gift Inbox' }} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// RZ-M-E2: Auth screens are wrapped in ErrorBoundary so any runtime error (e.g., in
// third-party SDKs like expo-secure-store or expo-local-authentication) shows a graceful
// fallback instead of a blank white screen.
function AuthStack() {
  return (
    <ErrorBoundary>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}

// RD-H-07 FIX: AppStack must also be wrapped in ErrorBoundary so runtime errors
// (e.g., in third-party SDKs) show a graceful fallback instead of blank white screen.
// Only AuthStack was wrapped — AppStack was missing this protection.
function AppStack() {
  return (
    <ErrorBoundary>
      <Stack.Navigator>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />

      {/* Chat */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.matchName,
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' },
        })}
      />

      {/* Gifts */}
      <Stack.Screen
        name="GiftPicker"
        component={GiftPickerScreen}
        options={{ title: 'Send a Gift', headerStyle: { backgroundColor: '#fff' } }}
      />

      {/* Meetup */}
      <Stack.Screen
        name="Meetup"
        component={MeetupScreen}
        options={{ title: 'Plan a Date', headerStyle: { backgroundColor: '#fff' } }}
      />
      <Stack.Screen
        name="Voucher"
        component={VoucherScreen}
        options={{ title: 'Your Voucher', headerStyle: { backgroundColor: '#faf5ff' } }}
      />

      {/* Profile */}
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: 'Edit Profile', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />

      <Stack.Screen
        name="CreatePlan"
        component={CreatePlanScreen}
        options={{ title: 'Create a Plan', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ title: 'Plan Details', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />
      <Stack.Screen
        name="Applicants"
        component={ApplicantsScreen}
        options={{ title: 'Applicants', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />
      <Stack.Screen
        name="MyPlans"
        component={MyPlansScreen}
        options={{ title: 'My Plans', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />
      <Stack.Screen
        name="PlanConfirm"
        component={PlanConfirmScreen}
        options={{ title: 'Confirm Attendance', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />

      <Stack.Screen
        name="RequestInbox"
        component={RequestInboxScreen}
        options={{ title: 'Message Requests', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />

      <Stack.Screen
        name="ExperienceWallet"
        component={ExperienceWalletScreen}
        options={{ title: 'Experience Rewards', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { color: '#1a1a2e', fontWeight: '700' } }}
      />
    </Stack.Navigator>
    </ErrorBoundary>
  );
}

export default function AppNavigator() {
  const { token, isLoading, loadToken, hasSeenOnboarding, markOnboardingDone } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => { loadToken(); }, []);
  useDeepLink(navigationRef);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  // First-launch onboarding — shown once before any auth
  if (!hasSeenOnboarding) {
    return <OnboardingScreen onDone={markOnboardingDone} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {token ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
