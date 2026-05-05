# Bayit — React Native Android App Specification

## 1. Overview

**Bayit** is a property access-codes manager. This document describes a React Native Android application that replicates the existing web app, connecting to the same Node/Express + Firestore backend already running on `http://localhost:5001`.

### Goals
- Allow residents and property managers to view, add, and (admin only) edit/delete property access codes from an Android device.
- Reuse the existing REST API without any backend changes.
- Enforce the same role-based access: **admin** (full CRUD) vs **editor** (add + read only).

---

## 2. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | React Native (Expo SDK 51+) | Expo Go for dev, bare workflow for release |
| Language | JavaScript (ES2022) | No TypeScript required, mirrors web codebase |
| Navigation | React Navigation v6 (Native Stack + Bottom Tabs) | |
| HTTP client | Axios | Same patterns as web `api/client.js` |
| Secure token storage | `expo-secure-store` | Replaces `localStorage` |
| Clipboard | `expo-clipboard` | For copy-code feature |
| State / Auth | React Context (`AuthContext`) | Mirror web implementation |
| Env vars | `react-native-dotenv` or Expo `app.config.js` extra | `API_BASE_URL` |
| Android min SDK | 26 (Android 8.0) | |
| Target SDK | 34 (Android 14) | |

---

## 3. Project Bootstrap

```bash
npx create-expo-app bayit-mobile --template blank
cd bayit-mobile
npx expo install expo-secure-store expo-clipboard
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install axios
```

Directory layout:
```
bayit-mobile/
  app.json
  App.jsx
  src/
    api/
      client.js          # Axios instance
    contexts/
      AuthContext.jsx    # JWT auth state
    navigation/
      AppNavigator.jsx   # Root navigator
      AuthStack.jsx      # Login / Register / ForgotPassword
      MainTabs.jsx       # Codes tab (+ future tabs)
    screens/
      LoginScreen.jsx
      RegisterScreen.jsx
      ForgotPasswordScreen.jsx
      CodesScreen.jsx
      PropertyDetailScreen.jsx
      AddPropertyScreen.jsx
      EditPropertyScreen.jsx
    components/
      CodeRow.jsx        # Single label+value row with copy button
      PropertyCard.jsx   # Card in list view
      LoadingOverlay.jsx
    theme/
      colors.js          # Brand palette
      typography.js
```

---

## 4. API Integration

Base URL is configured via environment:

```js
// src/api/client.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:5001/api',
  // 10.0.2.2 is the Android emulator loopback to host machine
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${original.baseURL ?? 'http://10.0.2.2:5001/api'}/auth/refresh`,
            { refreshToken }
          );
          await SecureStore.setItemAsync('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          // refresh failed — caller must redirect to login
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Endpoints used

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get `accessToken` + `refreshToken` |
| POST | `/api/auth/refresh` | No | Rotate tokens |
| POST | `/api/auth/forgot-password` | No | Trigger reset email |
| GET | `/api/codes?q=` | Yes | List properties (admin: all, editor: own household) |
| GET | `/api/codes/:id` | Yes | Single property |
| POST | `/api/codes` | Yes | Create property |
| PUT | `/api/codes/:id` | Admin | Update property |
| DELETE | `/api/codes/:id` | Admin | Delete property |

---

## 5. Auth Context

```js
// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, name, email, role, householdId }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync('user');
      if (raw) setUser(JSON.parse(raw));
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## 6. Navigation Structure

```
AppNavigator
├── (unauthenticated) → AuthStack
│   ├── LoginScreen           (default)
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
└── (authenticated) → MainTabs
    └── CodesTab (NativeStack)
        ├── CodesScreen        (list + search)
        ├── PropertyDetailScreen
        ├── AddPropertyScreen
        └── EditPropertyScreen  (admin only — pushed from detail)
```

`AppNavigator` reads `user` from `AuthContext` to decide which tree to render. A loading splash screen is shown while `SecureStore` is being read on startup.

---

## 7. Screens

### 7.1 LoginScreen

**Route:** `Login`  
**Purpose:** Authenticate an existing user.

**UI elements:**
- App logo / "Bayit" wordmark
- Email `TextInput` (keyboardType `email-address`, autoCapitalize `none`)
- Password `TextInput` (secureTextEntry)
- "Sign In" `TouchableOpacity` primary button
- "Forgot password?" link → `ForgotPasswordScreen`
- "Don't have an account? Register" link → `RegisterScreen`

**Behaviour:**
1. Call `login(email, password)` from `AuthContext`.
2. On success: navigation tree switches to `MainTabs` automatically (state change in context).
3. On error: show inline error message below the form.
4. Disable button and show `ActivityIndicator` while request is in flight.

---

### 7.2 RegisterScreen

**Route:** `Register`  
**Purpose:** Create a new editor account.

**UI elements:**
- Full Name `TextInput`
- Email `TextInput`
- Password `TextInput` (secureTextEntry, min 6 chars)
- "Create Account" button
- "Already have an account? Sign in" link

**Behaviour:**
1. Client-side validation: all fields required, password ≥ 6 characters.
2. Call `register(name, email, password)`.
3. On success: navigate to `MainTabs`.
4. Role assigned server-side (editor unless email matches `ADMIN_EMAILS`).

---

### 7.3 ForgotPasswordScreen

**Route:** `ForgotPassword`  
**Purpose:** Trigger a password-reset email.

**UI elements:**
- Email `TextInput`
- "Send Reset Link" button
- Success state: confirmation message replacing the form.
- Back link to `LoginScreen`.

**Behaviour:**
1. POST `/api/auth/forgot-password` with `{ email }`.
2. Always show success message (server does not expose whether email exists).

---

### 7.4 CodesScreen

**Route:** `Codes` (stack root inside `CodesTab`)  
**Purpose:** Searchable list of all accessible properties.

**UI elements:**
- Header title "Property Codes" + property count subtitle.
- Search bar (`TextInput` with clear button) — debounced 200 ms, calls `GET /api/codes?q=`.
- `FlatList` of `PropertyCard` components.
- FAB (Floating Action Button) "+" → `AddPropertyScreen`.
- Pull-to-refresh (`onRefresh`).

**PropertyCard component:**
- Property name (bold).
- Code count badge, e.g. "3 codes".
- Chevron icon indicating tappable.
- On press: navigate to `PropertyDetailScreen` with `{ id }`.

**Role differences:**
- All roles see the FAB and can navigate to add.
- Admin sees all properties in Firestore; editor sees own household only (enforced server-side, no client logic needed).

---

### 7.5 PropertyDetailScreen

**Route:** `PropertyDetail`  
**Params:** `{ id: string }`  
**Purpose:** View (and admin: edit/delete) a single property's codes and notes.

**UI elements:**
- Back button ("← Properties").
- Property name heading.
- **Codes section:** list of `CodeRow` components.
  - Each row shows `label` + `value`, with a copy icon.
  - Tapping copy calls `Clipboard.setStringAsync(value)` and shows a "Copied!" toast.
- **Notes section:** plain text display.
- *(Admin only)* "Edit" button → `EditPropertyScreen`.
- *(Admin only)* "Delete" button with confirmation `Alert.alert` dialog before deletion.

**Behaviour:**
- On mount: GET `/api/codes/:id`.
- On delete confirm: DELETE `/api/codes/:id`, then `navigation.goBack()`.
- Hide Edit/Delete buttons entirely if `user.role !== 'admin'`.

---

### 7.6 AddPropertyScreen

**Route:** `AddProperty`  
**Purpose:** Create a new property entry.

**UI elements:**
- Property Name `TextInput`.
- Dynamic code rows (label + value pairs):
  - "Add Code" button appends a new row.
  - Trash icon on each row removes it.
- Notes `TextInput` (multiline).
- "Save Property" button.
- Cancel / back navigation.

**Behaviour:**
1. Validate: name required, at least one complete code row.
2. POST `/api/codes` with `{ name, codes, notes }`.
3. On success: navigate back to `CodesScreen` and refresh the list.

---

### 7.7 EditPropertyScreen *(Admin only)*

**Route:** `EditProperty`  
**Params:** `{ id: string }`  
**Purpose:** Modify an existing property's name, codes, and notes.

**UI elements:** Same form layout as `AddPropertyScreen`, pre-populated with existing data.

**Behaviour:**
1. On mount: load existing property from params (passed from `PropertyDetailScreen`) or re-fetch if not available.
2. PUT `/api/codes/:id` with updated `{ name, codes, notes }`.
3. On success: navigate back to `PropertyDetailScreen` (replace), refresh data.
4. If non-admin somehow reaches this screen: show "Access denied" and go back.

---

## 8. Data Models

These mirror the Firestore documents:

```js
// Property
{
  id: string,           // Firestore doc ID
  name: string,         // e.g. "Riviera Entrance Gate"
  codes: [              // array of access code entries
    { label: string, value: string }
  ],
  notes: string,        // optional free text
  householdId: string,  // owner's household
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Auth user (stored in SecureStore)
{
  id: string,
  name: string,
  email: string,
  role: 'admin' | 'editor',
  householdId: string
}
```

---

## 9. Role-Based Access Rules

| Action | Admin | Editor |
|---|---|---|
| View property list | All properties | Own household only |
| View property detail | Any property | Own household only |
| Add property | ✅ | ✅ |
| Edit property | ✅ | ❌ (button hidden + server returns 403) |
| Delete property | ✅ | ❌ (button hidden + server returns 403) |

Enforcement is **dual-layer**: UI hides admin-only controls when `user.role !== 'admin'`, and the server enforces the same rules independently.

---

## 10. Theme & Styling

Use `StyleSheet.create` throughout (no CSS). Define a shared palette:

```js
// src/theme/colors.js
export default {
  primary:    '#4f46e5',   // indigo-600
  primaryDark:'#4338ca',   // indigo-700
  surface:    '#ffffff',
  background: '#f5f5f5',
  border:     '#e5e7eb',
  textPrimary:'#111827',
  textMuted:  '#6b7280',
  error:      '#dc2626',
  success:    '#16a34a',
};
```

### Typography
- Headings: `fontSize: 20, fontWeight: '700'`
- Body: `fontSize: 15, fontWeight: '400'`
- Muted: `fontSize: 13, color: colors.textMuted`

### Component guidelines
- Cards: `borderRadius: 12, padding: 16, backgroundColor: colors.surface, elevation: 2`
- Buttons: `borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20`
- Inputs: `borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 15`

---

## 11. Error Handling

- Network errors: display a `Banner` component (red background, message text) that auto-dismisses after 4 seconds.
- 401 responses: the Axios interceptor attempts token refresh; on failure, call `logout()` which triggers navigation back to `AuthStack`.
- 403 responses: show "You don't have permission to do this."
- 404 responses: show "Property not found" and go back.
- All API calls are wrapped in `try/catch`; errors surface to the UI via local `error` state, never silently swallowed.

---

## 12. Android-Specific Considerations

| Topic | Implementation |
|---|---|
| Emulator API URL | Use `http://10.0.2.2:5001` (maps to host `localhost`) |
| Physical device | Set `API_BASE_URL` to the host machine's LAN IP, e.g. `http://192.168.1.x:5001` |
| `android:usesCleartextTraffic` | Set to `true` in `android/app/src/main/AndroidManifest.xml` for local HTTP dev; remove for production (use HTTPS) |
| Keyboard avoiding | Wrap forms in `KeyboardAvoidingView behavior="height"` |
| Back gesture | `@react-navigation/native-stack` handles Android back button natively |
| Safe area | Wrap root in `<SafeAreaProvider>` from `react-native-safe-area-context` |
| Clipboard API | Use `expo-clipboard` (`Clipboard.setStringAsync`) — the old `Clipboard` from `react-native` is deprecated |
| Status bar | `<StatusBar barStyle="dark-content" backgroundColor={colors.background} />` |

---

## 13. Security Checklist

- [ ] Tokens stored in `expo-secure-store` (encrypted, not `AsyncStorage`).
- [ ] Access token expires in 15 minutes; refresh token in 7 days (server-controlled).
- [ ] No credentials or tokens logged to console in production.
- [ ] All API requests go over HTTPS in production (configure reverse proxy or deploy to a hosted environment).
- [ ] `android:usesCleartextTraffic` set to `false` in the production build.
- [ ] Role checks are enforced server-side; client-side checks are UI convenience only.

---

## 14. Build & Release

```bash
# Development (Expo Go)
npx expo start --android

# Production APK (local build)
npx expo run:android --variant release

# EAS Build (recommended for distribution)
npm install -g eas-cli
eas build --platform android --profile production
```

`eas.json` profile:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 15. Out of Scope (this version)

- iOS support (spec is Android-only)
- Offline / caching (no SQLite or MMKV)
- Push notifications
- Biometric lock screen
- Dark mode
- Image attachments per property
- Budget/Expenses tab (backend route exists but not exposed in mobile)
