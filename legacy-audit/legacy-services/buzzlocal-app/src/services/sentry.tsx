import * as React from 'react';
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://example@sentry.io/1234567';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Initialize Sentry for error monitoring
 */
export const initializeSentry = () => {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    enabled: ENVIRONMENT === 'production',

    // Sampling rate for production (0-1)
    tracesSampleRate: 0.1,

    // Enable crash reporting
    enableNativeCrashHandling: true,

    // Ignore errors
    ignoreErrors: [
      'Network request failed',
      'Timeout',
      'AbortError',
    ],

    // Release info
    release: 'buzzlocal@1.0.0',
  });

  console.log('Sentry initialized:', { dsn: SENTRY_DSN, environment: ENVIRONMENT });
};

/**
 * Set user context
 */
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category?: string,
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'app',
    data,
    timestamp: Date.now(),
  });
};

/**
 * Capture custom error
 */
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture custom message
 */
export const captureMessage = (message: string, level?: 'info') => {
  Sentry.captureMessage(message, level || 'info');
};

/**
 * Set custom tag
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Set custom context
 */
export const setContext = (name: string, context: Record<string, unknown>) => {
  Sentry.setContext(name, context);
};

/**
 * Track user action
 */
export const trackAction = (action: string, data?: Record<string, unknown>) => {
  addBreadcrumb(action, 'user_action', data);

  // Also capture as custom event in production
  if (ENVIRONMENT === 'production') {
    Sentry.captureEvent({
      type: 'transaction',
      transaction: action,
      contexts: {
        action: {
          action,
          ...data,
        },
      },
    });
  }
};

/**
 * React Error Boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Higher-order component for tracking
 */
export const withTracking = <P extends object>(
  Component: React.ComponentType<P>,
  trackingName: string
) => {
  return Sentry.withProfiler(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class TrackedComponent extends React.Component<unknown> {
      render() {
        return <Component {...(this.props as P)} />;
      }
    },
    { name: trackingName }
  );
};

// Re-export everything from Sentry
export * from '@sentry/react-native';
