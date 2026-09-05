# ⚡ Production-Grade Expo + Firebase Mobile Starter Template

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-blue.svg?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb.svg?logo=react&logoColor=black)](https://reactnative.dev/)
[![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v12.12.1-ffca28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.9-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-ready, robust starter foundation for cross-platform iOS, Android, and Web applications. Built from the ground up with **clean architectural layering**, **reactive authentication guards**, **isolated secrets management**, **strict type safety**, and **universal fallback resilience**.`

---`

## 📑 Table of Contents

- [Executive Architectural Overview](#-executive-architectural-overview)
- [Key Core Capabilities](#-key-core-capabilities)
- [Repository & Folder Structure](#-repository--folder-structure)
- [Prerequisites & Environment Setup](#-prerequisites--`environment-setup)
- [Quick Start Guide](#-quick-start-guide)
- [Authentication & State Machine](#-authentication--state-machine)
- [Developer Auth Bypass (Offline Mode)](#-developer-auth-bypass-offline-mode)
- [Navigation & Route Typings](#-navigation--route-typings)
- [Design System & Safe Area Handling](#-design-system--safe-area-handling)
- [Error Boundaries & Universal Fallbacks](#-error-boundaries--universal-fallbacks)
- [Production Hardening & Deployment](#-production-hardening--deployment)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [Contributing & License](#-contributing--license)`

---

## 🏛️ Executive Architectural Overview

This template addresses the common pitfalls of standard mobile boilerplate code (tight coupling, hardcoded keys, cold-start session drops, and uncaught rendering crashes) by establishing a structured **Feature-Layered Clean Architecture**:

### System Architecture Flow

```text
 ┌────────────────────────────────────────────────────────┐
 │                      App.tsx                           │
 │   [SafeAreaProvider] -> [ErrorBoundary] -> [AuthProvider]│
 └──────────────────────────┬─────────────────────────────┘
                            │
 ┌──────────────────────────▼─────────────────────────────┐
 │               src/navigation/AppNavigator              │
 │          (Declarative Reactive Route Guard)            │
 └─────────────┬────────────────────────────┬─────────────┘
               │ (if unauthenticated)       │ (if authenticat## 🚀 Key Core Capabilities

| Capability | Technical Implementation | Benefit |
|---|---|---|
| **Reactive Session Auth** | Firebase `onAuthStateChanged` + React Context | Eliminates imperative screen pushing; persists session seamlessly across cold restarts. |
| **Zero-Exposition Secrets** | `EXPO_PUBLIC_FIREBASE_*` + Strict `.gitignore` | Prevents credential leaks to VCS; allows per-environment `.env` configurations. |
| **Zero-Friction Dev Bypass** | In-memory mock user provisioning via `bypassAuth()` | Enables instant UI development without Firebase backend setup or network access. |
| **Strict Type Safety** | Generic `RootStackParamList` & `MainTabParamList` | Autocompletes navigation routes; catches route mismatches at compile-time (`tsc`). |
| **Edge-to-Edge Safe Insets** | `useSafeAreaInsets` + Dynamic Top/Bottom Padding | Ensures uniform header and status bar spacing on notched screens and Dynamic Islands. |
| **Runtime Resilience** | Class-based `ErrorBoundary` + `StateScreen` | Prevents white-screen app crashes by rendering interactive recovery screens. |
| **Universal State Handlers** | Purpose-built `StateScreen` (Offline, Error, Empty, Maintenance) | Provides consistent user feedback and explicit retry mechanisms. |

---

## 📂 Repository & Folder Structure

```text
expo-firebase-starter/
├── .env.example                     # Sanitized environment variable template
├── .env                             # Local private secrets (ignored by Git)
├── .gitignore                       # Hardened VCS ignore rules for all .env variants
├── App.tsx                          # Top-level composition root (Providers + ErrorBoundary)
├── app.config.ts                    # Dynamic Expo manifest configuration with bundle IDs
├── app.json                         # Base Expo project metadata & icon/splash paths
├── index.ts                         # Native root entrypoint (registerRootComponent)
├── package.json                     # Pinned dependencies & scripts
├── tsconfig.json                    # Strict TypeScript compiler options
└── src/
    ├── components/                  # Reusable Design System & Fallback Screens
    │   ├── AppHeader.tsx            # Standardized safe area header component
    │   ├── ErrorBoundary.tsx        # Top-level crash catcher with recovery actions
    │   └── StateScreen.tsx          # Reusable fallback for Empty, Error, Offline & Maintenance
    ├── config/                      # Third-Party Service Initializations
    │   └── firebaseconfig.ts        # Firebase client init with AsyncStorage persistence
    ├── context/                     # Global State Providers
    │   └── AuthContext.tsx          # Real-time auth session listener & Dev Bypass logic
    ├── navigation/                  # Strictly Typed Routing Architecture
    │   ├── AppNavigator.tsx         # Declarative auth gatekeeper (AuthStack vs AppStack)
    │   ├── MainTabs.tsx             # 5-Tab bottom navigation bar
    │   └── types.ts                 # Full TypeScript ParamLists & ScreenProp generics
    └── screens/                     # Modular Feature Screens
        ├── SplashScreen.tsx         # Animated branding & session preloader
        ├── LoginScreen.tsx          # Authentication login with password toggle & bypass
        ├── SignupScreen.tsx         # User registration with validation & bypass
        ├── HomeScreen.tsx           # Dashboard overview, quick stats & active systems
        ├── ExploreScreen.tsx        # Searchable module directory with category filters
        ├── NotificationsScreen.tsx  # Interactive security & system activity log
        ├── SettingsScreen.tsx       # Toggles for notifications, dark mode, biometrics & cache
        └── ProfileScreen.tsx        # User profile, account options & app support
```── MainTabs.tsx             # 5-Tab bottom navigation bar
    │   └── types.ts                 # Full TypeScript ParamLists & ScreenProp generics
    └── screens/                     # Modular Feature Screens
        ├── SplashScreen.tsx         # Animated branding & session preloader
        ├── LoginScreen.tsx          # Authentication login with password toggle & bypass
        ├── SignupScreen.tsx         # User registration with validation & bypass
        ├── HomeScreen.tsx           # Dashboard overview, quick stats & active systems
        ├── ExploreScreen.tsx        # Searchable module directory with category filters
        ├── NotificationsScreen.tsx  # Interactive security & system activity log
        ├── SettingsScreen.tsx       # Toggles for notifications, dark mode, biometrics & cache
        └── ProfileScreen.tsx        # User profile, account options & app support
``

---`

## 📦 Prerequisites & Environment Setup

Ensure you have the following installed on your local development machine:

- **Node.js**: 18.x or 20.x LTS ([Download Node.js](https://nodejs.org/))
- **Package Manager**: 
pm (v9+) or yarn (v1.22+)
- **Expo CLI**: Included with 
px expo
- **Mobile Client**:
  - Physical Device: Install **Expo Go** from the iOS App Store or Google Play Store.
  - Simulators: Xcode (macOS for iOS) or Android Studio (with Android Virtual Device).`

---`

## ⚡ Quick Start Guide`

### 1. Clone the Repository
`ash
git clone https://github.com/your-username/expo-firebase-starter.git
cd expo-firebase-starter
``

### 2. Install Dependencies
`ash
npm install
``

### 3. Setup Firebase Environment Variables
Create your local .`env file by copying the template:
`ash
cp .`env.example .`env
`

Open .`env and enter your Firebase web app configuration:
``env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
`

> **Note**: If you do not have Firebase credentials yet, you can leave placeholders and use the [Developer Bypass Mode](#-developer-auth-bypass-offline-mode) to test immediately.`

### 4. Start the Development Server
`ash
npx expo start -c
`
- Press  to launch Android Emulator.
- Press i to launch iOS Simulator.
- Press w to launch Web browser.
- Scan the QR code with **Expo Go** on Android or the iOS Camera app.`

---`

## 🔒 Authentication & State Machine

The template implements **Declarative Routing** driven by Firebase's native onAuthStateChanged stream:`

### How Authentication Works:
1. AuthProvider initializes and subscribes to Firebase auth updates with AsyncStorage persistence.
2. During initialization, AppNavigator displays the animated SplashScreen with dynamic status messages.
3. Once the session state resolves:
   - **user === null**: Displays public LoginScreen and SignupScreen.
   - **user !== null**: Displays protected MainTabs (HomeScreen, ExploreScreen, NotificationsScreen, SettingsScreen, ProfileScreen).
4. Signing in or out triggers an automatic state change—no manual 
avigation.navigate() or eplace() calls required.`

---`

## ⚡ Developer Auth Bypass (Offline Mode)

To enable rapid prototyping without internet access or Firebase configuration:

1. Launch the app on any device or simulator.
2. On the **Login** or **Signup** screen, tap:
   `````````````````	ext``	ext
   ⚡ Dev Bypass (Enter App Directly)
   ``
3. A mock developer profile (demo-user@example.com) is injected into AuthContext, transitioning the navigator to MainTabs instantly.`

---`

## 🧭 Navigation & Route Typings

All screens and navigators are fully typed with TypeScript generics:`

### Navigation Parameter Specifications (src/navigation/types.ts)
``	ypescript
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  NotificationsTab: undefined;
  SettingsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<MainTabParamList, T>;
``

### Adding a New Screen
1. Define the screen parameters in 	ypes.ts.
2. Implement your screen component with typed screen props:
   ``	ypescript
   import type { MainTabScreenProps } from '../navigation/types';

   export default function AnalyticsScreen({ navigation }: MainTabScreenProps<'AnalyticsTab'>) {
     return <View>...</View>;
   }
   `
3. Register the screen in src/navigation/MainTabs.tsx.`

---`

## 🎨 Design System & Safe Area Handling`

### Safe Area Inset Consistency
All screens utilize dynamic safe area insets via useSafeAreaInsets to ensure uniform vertical alignment:
``	ypescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Screen Content */}
    </View>
  );
}
``

### Standard Safe Header Component (AppHeader.tsx)
``	ypescript
<AppHeader 
  title="Dashboard" 
  subtitle="System Performance Overview"
  rightAction={
    <TouchableOpacity onPress={handleRefresh}>
      <Ionicons name="refresh" size={22} color="#4F46E5" />
    </TouchableOpacity>
  }
/>
``

---`

## 🛡️ Error Boundaries & Universal Fallbacks`

### Global Runtime Crash Protection
The application is wrapped with a class-based ErrorBoundary in App.tsx. Uncaught runtime rendering faults render a recovery UI rather than an abrupt native crash.`

### Purpose-Built Fallback Screen (StateScreen.tsx)
Use StateScreen for empty feeds, offline connectivity states, or error messages:

``	ypescript
import { StateScreen } from '../components/StateScreen';

// Offline State
<StateScreen 
  variant="offline" 
  onAction={checkConnection} 
/>

// Empty Data List
<StateScreen 
  variant="empty" 
  title="No Records Found" 
  description="Start creating items to populate your dashboard." 
  buttonText="Create Item" 
  onAction={handleCreate} 
/>

// Server / Network Error
<StateScreen 
  variant="error" 
  title="Sync Failed" 
  description="Unable to connect to the backend server." 
  buttonText="Retry Request" 
  onAction={handleRetry} 
/>
``

---`

## 🚀 Production Hardening & Deployment`

### 1. Static Type Validation
Validate that the entire repository complies with strict TypeScript standards:
`ash
npx tsc --noEmit
``

### 2. Configure Dynamic App Identifiers
Modify pp.config.ts with your company's reverse domain prefix:
``	ypescript
const companyPrefix = 'com.yourcompany'; // Example: com.acme.app
``

### 3. Building for App Stores (EAS Build)
1. Install EAS CLI:
   `ash
   npm install -g eas-cli
   `
2. Authenticate with Expo:
   `ash
   eas login
   `
3. Initialize build configuration:
   `ash
   eas build:configure
   `
4. Trigger production builds:
   `ash
   # Build Android APK / App Bundle (AAB)
   eas build --platform android --profile production

   # Build iOS IPA
   eas build --platform ios --profile production
   ``

---`

## ❓ Troubleshooting & FAQ`

### Q1: Firebase: Error (auth/invalid-api-key)
**Cause**: The EXPO_PUBLIC_FIREBASE_API_KEY is missing or empty in your .`env file.  
**Fix**: Ensure your .`env contains valid Firebase web credentials, then restart the bundler with 
px expo start -c. Alternatively, use the **⚡ Dev Bypass** button.`

### Q2: Metro bundler does not pick up .`env changes
**Cause**: Expo caches `environment variables at startup.  
**Fix**: Stop Metro (Ctrl+C) and start again with clear cache: 
px expo start -c.`

### Q3: Android build fails with package name errors
**Fix**: Ensure your slug in pp.json contains only alphanumeric characters and hyphens, and customize companyPrefix in pp.config.ts.`

---`

## 📜 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this template for personal, open-source, or commercial mobile applications.
