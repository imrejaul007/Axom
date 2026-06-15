# TrustOS Shield SDK

**Version:** 1.0.0
**Category:** Consumer Mobile SDK

---

## Overview

TrustOS Shield SDK provides consumer-facing scam protection and trust scoring for mobile apps. Integrates with the TrustOS Unified Gateway.

## Features

- ✅ Trust Score Display
- ✅ SMS Scam Detection
- ✅ WhatsApp Scam Detection
- ✅ Link/URL Safety Checking
- ✅ Phone Number Reputation
- ✅ Breach Monitoring (Email/Phone)
- ✅ Real-time Threat Alerts
- ✅ Background Sync

## Installation

```bash
npm install @axom/trust-os-shield-sdk
```

## Quick Start

### 1. Initialize SDK

```typescript
import { TrustShieldSDK } from '@axom/trust-os-shield-sdk';

const shield = new TrustShieldSDK({
  apiKey: 'your-api-key',
  apiBaseUrl: 'https://api.yourapp.com',
  userId: 'user-123',
});
```

### 2. Check SMS for Scam

```typescript
import { ScamAlertCard } from '@axom/trust-os-shield-sdk';

const result = await shield.checkSMS(
  'Your bank account will be blocked. Click here to verify: sbi-secure.xyz',
  '+919876543210'
);

if (result.success && result.data?.isScam) {
  // Show alert
  showAlert(<ScamAlertCard result={result.data} />);
}
```

### 3. Display Trust Score

```typescript
import { TrustScoreCard } from '@axom/trust-os-shield-sdk';

const score = await shield.getTrustScore();

if (score.success) {
  showScore(<TrustScoreCard score={score.data} />);
}
```

### 4. Monitor Breaches

```typescript
// Check email for breaches
const breach = await shield.checkEmailBreach('user@example.com');

// Add email to monitoring
await shield.addProtectedItem({
  type: 'email',
  value: 'user@example.com',
});

// Start background monitoring
shield.startBackgroundSync();
```

## API Reference

### TrustShieldSDK

#### Constructor

```typescript
new TrustShieldSDK({
  apiKey: string;
  apiBaseUrl: string;
  userId?: string;
  enableBackgroundSync?: boolean;
  syncIntervalMs?: number;
  onThreatDetected?: (threat) => void;
  onBreachDetected?: (breach) => void;
})
```

#### Methods

| Method | Description |
|--------|-------------|
| `setUser(userId)` | Set current user ID |
| `getProtectionStatus()` | Get full protection status |
| `getTrustScore()` | Get user's trust score |
| `checkSMS(content, sender?)` | Check SMS for scam |
| `checkWhatsApp(content, sender?)` | Check WhatsApp message |
| `checkLink(url)` | Check URL for scam |
| `checkPhone(phone)` | Check phone reputation |
| `checkEmailBreach(email)` | Check email breach |
| `reportScam(data)` | Report a scam |
| `startBackgroundSync()` | Start background monitoring |
| `stopBackgroundSync()` | Stop background monitoring |
| `destroy()` | Cleanup SDK |

### Components

#### TrustScoreCard

```typescript
<TrustScoreCard
  score={trustScore}
  compact={false}
  showDimensions={true}
/>
```

#### ScamAlertCard

```typescript
<ScamAlertCard
  result={scamResult}
  onShare={() => {}}
  onBlock={() => {}}
  onReport={() => {}}
/>
```

#### ScamBadge

```typescript
<ScamBadge riskScore={75} />
```

## Response Format

```typescript
interface SDKResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

## Example App Integration

### React Native

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TrustShieldSDK, TrustScoreCard, ScamAlertCard } from '@axom/trust-os-shield-sdk';

const shield = new TrustShieldSDK({
  apiKey: 'YOUR_API_KEY',
  apiBaseUrl: 'https://api.yourapp.com',
  userId: 'USER_ID',
  enableBackgroundSync: true,
  onThreatDetected: (threat) => {
    // Show notification
    showPushNotification('Scam Alert!', threat.reasons[0]);
  },
});

export default function App() {
  const [trustScore, setTrustScore] = useState(null);
  const [latestThreat, setLatestThreat] = useState(null);

  useEffect(() => {
    // Load trust score
    const loadScore = async () => {
      const result = await shield.getTrustScore();
      if (result.success) {
        setTrustScore(result.data);
      }
    };
    loadScore();
  }, []);

  const handleCheckSMS = async (sms) => {
    const result = await shield.checkSMS(sms);
    if (result.success && result.data?.isScam) {
      setLatestThreat(result.data);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {trustScore && (
        <TrustScoreCard score={trustScore} />
      )}

      {latestThreat && (
        <ScamAlertCard
          result={latestThreat}
          onReport={() => shield.reportScam({ type: 'sms', content: latestThreat })}
          onBlock={() => {/* block number */}}
        />
      )}
    </View>
  );
}
```

## Status

- [x] Core SDK
- [x] Trust Score components
- [x] Scam detection components
- [x] Breach monitoring
- [x] Background sync
- [ ] Push notifications (platform-specific)
- [ ] Call screening (native module)
- [ ] SMS interception (native module)
