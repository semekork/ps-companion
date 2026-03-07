# PS App — Technical Architecture

**Version:** 1.0  
**Date:** 7 March 2026  
**Status:** Draft

---

## 1. Stack Summary

| Concern | Solution | Rationale |
|---|---|---|
| Global/UI state | React Context API | Built-in, zero deps, sufficient for auth + user profile |
| Server/API state | TanStack Query v5 | Caching, background refetch, pagination, stale-while-revalidate |
| Auth token storage | `expo-secure-store` | Keychain/Keystore-backed, safe for credentials |
| Cached data (offline) | `AsyncStorage` | Last-fetched lists survive app restarts |
| Styling | NativeWind v4 (Tailwind) | Utility classes, dark mode via `dark:`, responsive |
| Code organisation | Feature-based folders | Co-located screens, hooks, components per domain |
| TypeScript | Standard mode | Types where they matter, no `strict` overhead |
| Navigation | Expo Router (file-based) | Already set up, stack + tabs built-in |

---

## 2. Context API — Global State

Two lean contexts — **not** used as a data cache (that is TanStack Query's job):

### `AuthContext`
```ts
{
  accessToken: string | null;
  refreshToken: string | null;
  accountId: string | null;
  isAuthenticated: boolean;
  signIn(npsso: string): Promise<void>;
  signOut(): Promise<void>;
}
```
- Populated from `expo-secure-store` on cold start.
- Updated on sign-in / sign-out / token refresh events.
- Triggers root layout redirect to `/auth` when `isAuthenticated` is false.

### `UserContext`
```ts
{
  profile: PsnProfile | null;
  trophySummary: TrophySummary | null;
}
```
- Fetched once on first successful authentication.
- Held in memory for the session lifetime.
- Cleared on sign-out.

---

## 3. TanStack Query — Server State

Every PSN and RSS call goes through a query or mutation. The `QueryClient` is configured once at the root (`app/_layout.tsx`).

### Query Key Convention
```ts
['library', accountId]
['trophies', 'summary', accountId]
['trophies', 'titles', accountId]
['friends', accountId]
['friend', 'presence', targetAccountId]
['friend', 'profile', targetAccountId]
['news', page]
['game', 'detail', titleId]
```

### Configuration
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 60 * 24,     // 24 hours (persisted via AsyncStorage)
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});
```

### Mutations
Used for write-adjacent actions only:
- `useSignIn` — NPSSO → access/refresh token exchange
- `useRefreshToken` — silent access token renewal

---

## 4. AsyncStorage — Offline Persistence

TanStack Query's `AsyncStoragePersister` is used to persist the query cache between app restarts. No manual `AsyncStorage` calls are needed — serialisation is handled automatically.

```ts
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'PS_APP_QUERY_CACHE',
});
```

**Behaviour:**
- On cold start the persisted cache is hydrated immediately — users see last-fetched data while fresh data loads in the background.
- Cache is keyed per query key. Signing out calls `queryClient.clear()` to wipe all cached data.

---

## 5. NativeWind v4 — Styling

All new components use Tailwind utility classes. Existing `ThemedText` / `ThemedView` components will be progressively refactored.

### Dark Mode
Dark mode is driven by the device color scheme automatically via the `dark:` variant:
```tsx
<View className="bg-white dark:bg-slate-900 rounded-xl p-4" />
```

### Custom Tailwind Tokens
PlayStation brand and trophy colors are registered in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      'ps-blue':      { DEFAULT: '#00439C', dark: '#0070D1' },
      'ps-accent':    { DEFAULT: '#0070D1', dark: '#4DA6FF' },
      'trophy-platinum': { DEFAULT: '#B0C4DE', dark: '#C8D8E8' },
      'trophy-gold':     { DEFAULT: '#D4AF37', dark: '#FFD700' },
      'trophy-silver':   { DEFAULT: '#A8A9AD', dark: '#C0C0C0' },
      'trophy-bronze':   { DEFAULT: '#CD7F32', dark: '#E8956D' },
    }
  }
}
```

---

## 6. Folder Structure

```
app/                              ← Expo Router screens (thin shells only)
  _layout.tsx                     ← Root layout, providers, auth redirect
  auth.tsx                        ← NPSSO entry screen
  modal.tsx
  (tabs)/
    _layout.tsx                   ← 5-tab bottom navigator
    index.tsx                     ← → Dashboard feature
    library.tsx                   ← → Library feature
    trophies.tsx                  ← → Trophies feature
    friends.tsx                   ← → Friends feature
    news.tsx                      ← → News feature
  game/
    [titleId].tsx                 ← → Game Detail feature
  friend/
    [accountId].tsx               ← → Friend Profile feature

features/                         ← All domain logic, co-located by feature
  dashboard/
    dashboard-screen.tsx
    use-dashboard.ts              ← TanStack Query hooks
  library/
    library-screen.tsx
    game-card.tsx
    use-library.ts
  trophies/
    trophies-screen.tsx
    trophy-badge.tsx
    progress-ring.tsx
    use-trophies.ts
  friends/
    friends-screen.tsx
    friend-row.tsx
    psn-avatar.tsx
    use-friends.ts
  news/
    news-screen.tsx
    news-card.tsx
    use-news.ts
  game-detail/
    game-detail-screen.tsx
    trophy-list.tsx
    use-game-detail.ts
  friend-profile/
    friend-profile-screen.tsx
    use-friend-profile.ts

services/                         ← Pure async functions, no React
  psn-auth.ts
  psn-games.ts
  psn-trophies.ts
  psn-friends.ts
  psn-news.ts

context/
  auth-context.tsx
  user-context.tsx

components/                       ← Truly shared, feature-agnostic UI
  platform-badge.tsx
  skeleton-placeholder.tsx
  themed-text.tsx                 ← (existing → refactor to NativeWind)
  themed-view.tsx                 ← (existing → refactor to NativeWind)
  external-link.tsx               ← (existing)
  haptic-tab.tsx                  ← (existing)
  parallax-scroll-view.tsx        ← (existing)
  ui/
    collapsible.tsx               ← (existing)
    icon-symbol.tsx               ← (existing, extend with new icons)

hooks/
  use-auth.ts                     ← Convenience wrapper for AuthContext
  use-user.ts                     ← Convenience wrapper for UserContext
  use-color-scheme.ts             ← (existing)
  use-theme-color.ts              ← (existing)

constants/
  theme.ts                        ← Extend with PS + trophy colors

types/
  psn.ts                          ← Shared TypeScript types for PSN data shapes
```

---

## 7. Data Flow

End-to-end example — Library tab:

```
User opens Library tab
  → app/(tabs)/library.tsx        (route shell — renders LibraryScreen)
    → features/library/library-screen.tsx
      → useLibrary() hook
        → TanStack Query: queryKey ['library', accountId]
          → services/psn-games.ts → psn-api → PSN servers
          ← AsyncStorage cache shown immediately (stale)
          ← fresh response updates cache in background
      ← renders <GameCard /> list with NativeWind classes
        → tap row → router.push('/game/CUSA01433_00')
          → app/game/[titleId].tsx
            → features/game-detail/game-detail-screen.tsx
              → useGameDetail(titleId) hook
                → TanStack Query: queryKey ['game', 'detail', titleId]
                  → services/psn-trophies.ts → psn-api
```

---

## 8. Authentication Flow

```
Cold start
  → AuthContext reads expo-secure-store
    ↳ tokens found + access token valid     → go to (tabs)
    ↳ tokens found + access token expired   → call refreshAccessToken()
        ↳ success                           → go to (tabs)
        ↳ refresh token expired             → go to /auth
    ↳ no tokens                             → go to /auth

/auth screen
  → user pastes NPSSO token → taps Sign In
    → services/psn-auth.ts
        → exchangeNpssoForAccessCode(npsso)
        → exchangeAccessCodeForAuthTokens(code)
    → AuthContext.signIn() stores accessToken + refreshToken in expo-secure-store
    → router.replace('/(tabs)')

Background token refresh (on API 401)
  → services layer catches 401
  → calls exchangeRefreshTokenForAuthTokens(refreshToken)
  → updates AuthContext + expo-secure-store
  → retries the original request
```

---

## 9. Dependencies to Add

| Package | Purpose |
|---|---|
| `nativewind` | Tailwind utility styling for React Native |
| `tailwindcss` | NativeWind peer dependency |
| `@tanstack/react-query` | Server state — fetching, caching, pagination |
| `@tanstack/query-async-storage-persister` | Persist query cache to AsyncStorage |
| `@react-native-async-storage/async-storage` | AsyncStorage implementation |
| `psn-api` | PlayStation Network unofficial API wrapper |
| `expo-secure-store` | Secure token storage (Keychain / Keystore) |
| `fast-xml-parser` | Parse PS Blog RSS feed |

---

## 10. Conventions

- **File naming:** `kebab-case` for all files and folders (already established in project).
- **Component naming:** PascalCase named exports.
- **Hook naming:** `use-` prefix, camelCase export (e.g. `useLibrary`).
- **Service functions:** plain `async` functions, no React — fully unit-testable in isolation.
- **Query hooks:** one file per feature (`use-library.ts`), wraps `useQuery` / `useMutation`, imports from `services/`.
- **Types:** centralised in `types/psn.ts` for shared PSN data shapes; local types stay in the feature folder.
- **No barrel `index.ts` files** — import directly from the source file to keep tree-shaking clean.
