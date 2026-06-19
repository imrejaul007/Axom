/**
 * useDeepLink
 *
 * Handles push notification taps and URL deep links.
 * Navigates to the correct screen based on the notification data payload.
 *
 * Supported payloads:
 *   { type: 'match',            matchId, matchName }  → Chat screen
 *   { type: 'message',          matchId, matchName }  → Chat screen
 *   { type: 'gift',             giftId }              → Gift Inbox tab
 *   { type: 'meetup',           matchId }             → Meetup screen
 *   { type: 'reward'  }                               → Profile tab (wallet)
 *   { type: 'message_request',  requestId }           → Request Inbox
 *   { type: 'plan_applied',     planId }              → Plan Detail
 *   { type: 'plan_selected',    matchId }             → Chat screen
 *   { type: 'plan_ghost',       planId }              → Plan Detail
 *   { type: 'plan_expired' }                          → My Plans
 *   { type: 'referral_coins' }                        → Profile tab (coins earned)
 *
 * URL paths:
 *   rendez://invite/{code}   → stores code + navigates to onboarding/profile setup
 */

import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { referralAPI } from '../services/api';

type RootStackParamList = Record<string, object | undefined>;

export function useDeepLink(navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>) {
  useEffect(() => {
    // Handle notification tap when app is in background/foreground
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      handlePayload(data);
    });

    // Handle URL deep links (e.g., rendez://match/abc123)
    const urlSub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    // Handle cold-start URL
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => {
      subscription.remove();
      urlSub.remove();
    };
  }, [navigationRef]);

  function navigate(screen: string, params?: Record<string, string>) {
    navigationRef.current?.dispatch(
      CommonActions.navigate({ name: screen, params }),
    );
  }

  function handlePayload(data: Record<string, string>) {
    if (!data?.type) return;

    switch (data.type) {
      case 'match':
        navigate('Chat', { matchId: data.matchId, matchName: data.matchName || 'Match', matchPartnerId: data.matchPartnerId || '' });
        break;
      case 'message':
        navigate('Chat', { matchId: data.matchId, matchName: data.matchName || 'Message', matchPartnerId: data.matchPartnerId || '' });
        break;
      case 'gift':
        navigate('Main', { screen: 'Gifts' });
        break;
      case 'meetup':
        navigate('Meetup', { matchId: data.matchId });
        break;
      case 'reward':
        navigate('Main', { screen: 'Profile' });
        break;

      // Chat requests
      case 'message_request':
        navigate('RequestInbox');
        break;
      case 'request_declined':
        navigate('Main', { screen: 'Matches' });
        break;

      // Plans
      case 'plan_applied':
        if (data.planId) navigate('Applicants', { planId: data.planId });
        break;
      case 'plan_selected':
        if (data.matchId) navigate('Chat', { matchId: data.matchId, matchName: 'Your date', matchPartnerId: data.matchPartnerId || '' });
        break;
      case 'plan_ghost':
      case 'plan_expired':
        navigate('MyPlans');
        break;

      // Referral
      case 'referral_coins':
        navigate('Main', { screen: 'Profile' });
        break;

      default:
        break;
    }
  }

  function handleUrl(url: string) {
    try {
      // rendez://match/matchId  or  https://rendez.in/match/matchId
      const path = url.replace(/^(rendez:\/\/|https?:\/\/rendez\.in\/)/, '');
      const [section, id] = path.split('/');

      switch (section) {
        case 'match':
          if (id) navigate('Chat', { matchId: id, matchName: 'Match', matchPartnerId: '' });
          break;
        case 'gift':
          navigate('Main', { screen: 'Gifts' });
          break;
        case 'plan':
          if (id) navigate('PlanDetail', { planId: id });
          break;
        case 'requests':
          navigate('RequestInbox');
          break;
        case 'invite':
          // RZ-M-D1: Validate referral code via API before storing. Previously any URL like
          // rendez://invite/xyz123 would store the code without checking if it's valid,
          // leading to silent failures when ProfileSetupScreen tried to apply it.
          // Now we validate against the server first and store only on success.
          if (id) {
            referralAPI.applyCode(id)
              .then(() => SecureStore.setItemAsync('pending_referral_code', id))
              .catch(() => { /* invalid code — silently ignore */ });
          }
          break;
        default:
          break;
      }
    } catch {
      // Ignore malformed URLs
    }
  }
}
