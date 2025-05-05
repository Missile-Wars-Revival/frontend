# Missile Wars Frontend

The official frontend app for Missile Wars, developed by [longtimeno-c](https://github.com/longtimeno-c).

Project details [here:](https://www.tristans.club/missilewars).

## ⚠️ License & Usage Notice
This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). This means:

- ✅ You can view and fork this code
- ✅ You can use this code for personal projects
- ✅ You can modify the code
- ❌ You cannot use this code in closed-source commercial projects
- ❗ Any modifications or usage of this code must be made open source
- ❗ You must include the original license and copyright notice

For the full license text, see [LICENSE](LICENSE.md)

Copyright (c) 2024 longtimeno-c. All rights reserved.

## 🚀 Features
- Real-time game interface using WebSocket connections
- Google Maps integration
- In-app purchases via RevenueCat
- Push notifications support
- Cross-platform support (iOS & Android)

## 📋 Prerequisites
- Node.js (latest LTS version)
- npm (latest version)
- Expo CLI
- iOS/Android development environment for native builds

## 🛠️ Setup

### 1. Environment Configuration
Create an `.env` file in the root directory:
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=""
EXPO_PUBLIC_BACKEND_URL=https://api.example.dev
EXPO_PUBLIC_WEBSOCKET_URL=wss://api.example.dev
EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE=""
EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE=""
```

### 2. Installation
```bash
npm install
```

## 🚀 Development

### Running the App
```bash
npm start
```

### Using Expo Go
After starting the development server, press 's' to switch to Expo Go mode if needed:
This will not work with current config as there are lots of native modules that are not supported in Expo Go.
```
Using development build
› Press s │ switch to Expo Go
```

### Test Accounts
To login in to a test account use either:
- Username: `Test` or `Test2`
- Password: `Testing123!`

## 🏗️ Building

### Pre-Build Setup
```bash
npx expo prebuild --platform ios
```
Note: Only required when developing native code

### Build Profiles

#### Preview Build
```bash
eas build --profile preview --platform all
# or
eas build --profile preview --platform ios
```

#### Development Build
```bash
eas build --profile development --platform all
# or
eas build --profile development --platform ios
```

#### Production Build
```bash
eas build --profile production --platform all
# or
eas build --profile production --platform ios
```

### App Store Submission
```bash
eas submit --platform ios
eas submit --platform android
```

## 🧪 Testing

### Notification Testing
Use the Expo Notifications tool:
```
https://expo.dev/notifications
```

## 📝 Support
For support, please open an issue in the GitHub repository or contact me on [X](https://x.com/longtimeno_c).

## ✨ Acknowledgments
- Expo Team
- React Native Community
- RevenueCat
- Google Maps Platform
