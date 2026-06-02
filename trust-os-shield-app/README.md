# TrustOS Shield App

Consumer-facing mobile app for scam protection and trust monitoring.

## Features

- **Trust Score Dashboard** - View your overall trust score and breakdown
- **Scan Anything** - Check SMS, links, and phone numbers for scams
- **Breach Alerts** - Get notified when your data appears in breaches
- **Protection Status** - Monitor your scam protection status
- **Protected Items** - Manage emails and phones you're monitoring

## Screens

### Home
Dashboard showing:
- Protection status
- Quick scan actions
- Recent alerts summary
- Trust score preview

### Scan
Scan various content types:
- **SMS** - Paste message text to check
- **Links** - Check URL safety
- **Calls** - Enter phone number to check reputation

### Score
Detailed trust score view:
- Overall score (0-1000)
- Score breakdown by dimension
- Historical trend chart
- Score factors (positive/negative)

### Alerts
Breach and scam alerts:
- Filter by type (all/unresolved/resolved)
- Severity indicators
- Action buttons (resolve, dismiss)

### Settings
App configuration:
- Protected items management
- Protection feature toggles
- Notification preferences
- Privacy settings

## Setup

```bash
# Install dependencies
npm install

# Start Expo development
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Configuration

Update `src/services/api.ts` with your API base URL:

```typescript
const API_BASE_URL = 'http://your-server:4166';
```

## Tech Stack

- **Framework:** React Native + Expo
- **Navigation:** React Navigation
- **HTTP Client:** Axios
- **Storage:** AsyncStorage

## Dependencies

- expo
- react-navigation
- axios
- @expo/vector-icons

## License

Internal - REZ Trust Network
