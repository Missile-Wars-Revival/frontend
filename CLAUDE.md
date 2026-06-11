# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Missile Wars — a real-time, location-based multiplayer game built with Expo (SDK 56) / React Native 0.85 and Expo Router. Players appear on a Google map and fire missiles, place landmines, and collect loot at real-world coordinates. There is no test suite; verification is lint + running the app.

## Commands

```bash
npm install            # runs patch-package on postinstall (patches/ dir)
npm start              # expo start (requires a dev client build — Expo Go does NOT work, too many native modules)
npm run ios            # expo run:ios
npm run android        # expo run:android
npm run lint           # expo lint (eslint-config-expo, flat config in eslint.config.js)
npx tsc --noEmit       # type check (strict mode, noUncheckedIndexedAccess)
npx expo prebuild --platform ios   # only when native code changes
eas build --profile development|preview|production --platform ios|android
```

Required `.env` (loaded via `loadenv.js` / app.json `extra.dotenv`): `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_BACKEND_URL`, `EXPO_PUBLIC_WEBSOCKET_URL`, `EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE`, `EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE`.

Dev login: username `Test` (or `Test2`), password `Testing123!`. In `__DEV__`, if the backend is unreachable, `api/login.ts` falls back to a frontend-only offline session with token `dev-offline-token`; that sentinel token is checked throughout `api/` and the websocket hook to skip network calls — preserve those checks when touching auth or API code.

## Architecture

### Data flow: WebSocket-first, REST second

Almost all live game state arrives over a single WebSocket, not REST:

1. `hooks/websockets/websockets.ts` — `useWebSocket()` opens one connection to `EXPO_PUBLIC_WEBSOCKET_URL?token=<JWT>` with exponential-backoff reconnect. Messages are msgpack-compressed, encoded/decoded with `zip`/`unzip` from the **`middle-earth`** package (a shared types+serialization library on GitHub: `Missile-Wars-Revival/middle-earth` — the contract between frontend and backend). The hook demultiplexes messages into per-domain state: missiles, landmines, loot, other entities, health, friends, inventory, player locations, leagues.
2. `app/_layout.tsx` wraps the app in `WebSocketContext.Provider` (defined in `util/Context/websocket.tsx`), exposing that state plus `sendWebsocket()`.
3. `hooks/websockets/*hook.ts` (`missilehook`, `landminehook`, `loothook`, etc.) are small per-domain hooks that filter the context data; map components consume these.

REST calls live in `api/` — one file per domain, all using `api/axios-instance.ts` (baseURL from `EXPO_PUBLIC_BACKEND_URL`). Auth: username → email lookup → Firebase `signInWithEmailAndPassword` → idToken posted to `/api/login`; the backend JWT is kept in `expo-secure-store` under `"token"`. React Query is available (`hooks/api/`) but most calls are direct.

### Provider stack & auth gating

`app/_layout.tsx` is the heart of startup. Provider order (outermost first): QueryClient → Countdown → Auth → OnboardingGate → WebSocket → Landmine → Onboarding → PermissionsCheck → Stack. Notes:

- A custom in-app splash (`app/splashscreen.tsx`) decides initial auth before the providers mount; `AuthProvider` (`util/Context/authcontext.tsx`) just holds an `isSignedIn` boolean mirrored to AsyncStorage key `signedIn`.
- `OnboardingGate` shows `PermissionsScreen` for signed-in users until AsyncStorage `alreadyLaunchedV3` is set.
- Returning from background after >2 minutes forces a splash + reload cycle.
- RevenueCat (`react-native-purchases`) is configured once here; AdMob via `util/AdService.ts` initializes after sign-in.

### Routing

Expo Router file-based routes in `app/`. `(tabs)/_layout.tsx` uses **`expo-router/unstable-native-tabs`** (NativeTabs) with five tabs: index (map), store, league, friends, profile. Non-tab routes: `login`, `chat/[id]`, `friendslist`, `PermissionsScreen`, `splashscreen`.

### Modal / bottom-sheet sequencing

The fire/placement flows stack three layers: the "Select Action" RN `Modal` (`fire-type-popup.tsx`) → the inventory bottom sheet (`components/ui/inventory-bottom-sheet.tsx`, a single RN `Modal` on all platforms) → a placement RN `Modal` with a map. iOS runs only one modal transition at a time, so presentations/dismissals must be serialized: trigger the next open/close from the previous modal's `onDismiss` on iOS (immediately on Android, where RN `Modal` never fires `onDismiss`), never flip two modal `visible` states in the same tick. Selecting an inventory item closes the sheet first and presents the placement modal from the sheet's `onDismiss` (see `usePlacementFlow` in `components/ui/placement-library.tsx`). Placement popups must stay mounted (toggle `visible`, don't conditionally unmount) because unmounting an open RN Modal on iOS skips `onDismiss`. Keep popups hoisted to the sheet's sibling level, never inside its children (see `MissileLibraryView` in `missile-confirmation-popup.tsx`).

### Map entities

`app/(tabs)/index.tsx` hosts the map (`components/map-comp.tsx`, react-native-maps with Google provider). Each entity type follows the same pattern in `components/<Entity>/`: `map-<entity>.tsx` (renders markers from the websocket hook), `<entity>.tsx` (entity UI), `<entity>placement.tsx` (firing/placing flow). Map visual themes live in `map-themes/` (Android JSON styles; iOS handled separately).

### Conventions

- **Styling**: `twrnc` — import `tw` from `util/twrnc.ts` (configured by `tailwind.config.js`). Some files still use `StyleSheet.create`; match the file you're in.
- **Icons**: use the scoped `@react-native-vector-icons/*` packages (ionicons, fontawesome, material-design-icons), NOT `@expo/vector-icons`.
- **Platform forks**: platform-specific files are used where iOS/Android diverge (e.g. `FriendsList.ios.tsx`/`.android.tsx`, `inventory-bottom-sheet.ios.tsx`/`.android.tsx`, `AdBanner.native.tsx`).
- **Path alias**: `@/*` maps to repo root (tsconfig + babel module-resolver), though most existing imports are relative.
- React Compiler is enabled (`experiments.reactCompiler` in app.json).
- Persistent client state goes through AsyncStorage with string keys (`signedIn`, `dbconnection`, `selectedMapStyle`, `regionlocation`, `alreadyLaunchedV3`, …); secrets (JWT, Firebase UID) go in expo-secure-store.

## Workflow rules (from CONTRIBUTING.md)

Never push to main — work on a feature branch and open a PR for review by lead devs.
