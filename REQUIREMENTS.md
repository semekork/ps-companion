# PS App — Product Requirements Document

**Version:** 1.0  
**Date:** 7 March 2026  
**Status:** Draft

---

## 1. Overview

PS App is a React Native (Expo) companion application for PlayStation Network users. It provides a unified mobile experience for tracking games, trophies, friends activity, and PlayStation news — all powered by real PSN data via the unofficial `psn-api` library.

---

## 2. Goals

- Give PS gamers a clean, fast mobile dashboard for their PSN profile
- Surface game library stats, trophy progress, and friends' online activity in one place
- Aggregate PlayStation Blog news and deals
- Persist sessions securely so users don't need to re-authenticate frequently

---

## 3. Target Platforms

| Platform | Support |
|---|---|
| iOS | ✅ Required |
| Android | ✅ Required |
| Web | ❌ Out of scope for MVP |

---

## 4. Authentication

### 4.1 Method
Users authenticate using an **NPSSO token** retrieved manually from the PlayStation SSO cookie endpoint.

### 4.2 Flow
1. User visits `https://www.playstation.com` and signs in via their browser.
2. User navigates to `https://ca.account.sony.com/api/v1/ssocookie` to retrieve their NPSSO token.
3. User pastes the 64-character NPSSO token into the app's auth screen.
4. The app exchanges the NPSSO for an access token + refresh token via `psn-api`.
5. Tokens are stored securely using `expo-secure-store` (iOS Keychain / Android Keystore).

### 4.3 Token Management
- **Access token** lifetime: ~1 hour — auto-refreshed silently using the stored refresh token on app resume.
- **Refresh token** lifetime: ~2 months — if expired, user is prompted to re-paste their NPSSO token.
- **Sign out** clears all tokens from secure storage and redirects to the auth screen.

### 4.4 Auth Screen Requirements
- Brief instructional card explaining the NPSSO retrieval steps.
- A tappable link that opens `https://ca.account.sony.com/api/v1/ssocookie` in the system browser.
- A `TextInput` for the NPSSO token (secure text entry, paste-friendly).
- A "Sign In" button that triggers the token exchange.
- Inline error state if the token is invalid or the exchange fails.
- Loading indicator during the exchange.

---

## 5. Navigation Structure

### 5.1 Stack Screens
| Route | Description |
|---|---|
| `/auth` | NPSSO entry — shown when unauthenticated |
| `/(tabs)` | Main tab navigator — shown when authenticated |
| `/game/[titleId]` | Game detail screen |
| `/friend/[accountId]` | Friend profile screen |

### 5.2 Bottom Tabs
| Tab | Icon | Screen |
|---|---|---|
| Home | house.fill | Dashboard |
| Library | gamecontroller.fill | Game Library |
| Trophies | trophy.fill | Trophy Tracker |
| Friends | person.2.fill | Friends Activity |
| News | newspaper.fill | PS Blog News |

---

## 6. Screens & Features

### 6.1 Dashboard (Home Tab)

A summary overview of all sections.

**Requirements:**
- **Recently Played card** — shows the last 3 played games (cover art, name, last played date). Taps open the Library tab.
- **Trophy Level card** — circular progress ring showing current trophy level, tier badge (1–10), and % progress to next level. Taps open the Trophies tab.
- **Friends Online card** — count of friends currently online with small avatars. Taps open the Friends tab.
- **Latest News card** — headline and thumbnail of the most recent PS Blog post. Taps open the News tab.
- Pull-to-refresh reloads all cards.
- Skeleton placeholder loading states for each card.

---

### 6.2 Game Library

**Data source:** `getUserPlayedGames` (psn-api)

**Requirements:**
- Full scrollable list of all played games.
- Each row shows: game cover image, title, platform badge (PS5 / PS4), last played date, total play duration (formatted from ISO 8601, e.g. "228h 56m").
- Sort options: Last Played (default), Most Played, Alphabetical.
- Filter by platform (All / PS5 / PS4).
- Search bar to filter by game name.
- Tap a row to open the Game Detail screen.
- Pull-to-refresh.
- Empty state if no games found.

---

### 6.3 Game Detail

**Data sources:** `getUserPlayedGames`, `getUserTrophiesForSpecificTitle`

**Requirements:**
- Full-bleed header with game cover/banner art.
- Game name, platform, first played date, last played date, total play time.
- Trophy summary for the game: bronze / silver / gold / platinum earned vs. total, and overall completion %.
- Completion progress bar.
- List of individual trophies: icon, name, description, grade, earned/not earned status.
- If not yet earned trophies have hidden names, show "Hidden Trophy" placeholder.

---

### 6.4 Trophy Tracker

**Data sources:** `getUserTrophyProfileSummary`, `getUserTitles`

**Requirements:**
- **Profile summary card** at top: avatar (from UserContext), PSN ID, trophy level, tier (1–10), progress ring, and bronze/silver/gold/platinum totals.
- Scrollable list of all trophy titles from `getUserTitles`.
- Each row: game cover, title name, platform, trophy progress (earned / total), platinum earned indicator, last updated date.
- Sort by: Last Updated (default), Completion %, Platinum first.
- Filter by: All / Platinum Earned / Incomplete / 100% Complete.
- Search bar.
- Tap a title to open the Game Detail screen's trophy view.
- Pull-to-refresh.

---

### 6.5 Friends Activity

**Data sources:** `getUserFriendsAccountIds`, `getBasicPresence`, `getProfileFromAccountId`

**Requirements:**
- List of all PSN friends, sorted: Online first, then by last online date (most recent first).
- Each row: avatar, PSN online ID, online status indicator (green dot = online, grey = offline), primary platform, last online date if offline.
- If friend is **online**: show currently playing game title and platform from `gameTitleInfoList`.
- Tap a friend row to open the Friend Profile screen.
- Pull-to-refresh.
- Gracefully handle friends with restricted privacy settings (show name + "Profile is private").
- Empty state if friend list is empty.

---

### 6.6 Friend Profile

**Data source:** `getProfileFromAccountId`, `getUserTrophyProfileSummary`, `getUserPlayedGames` (if publicly accessible)

**Requirements:**
- Avatar, PSN online ID, about me text, PS Plus badge if applicable.
- Trophy level + platinum count.
- Recently played games (if visible under their privacy settings).
- If data is blocked by privacy settings, show a friendly "This player's profile is private" message.

---

### 6.7 News & Deals

**Data source:** PlayStation Blog RSS feed (`https://blog.playstation.com/feed/`)

**Requirements:**
- Card-style list of recent blog posts (minimum 20 posts loaded initially).
- Each card: post thumbnail image, headline, publication date, category tag (e.g. "PS5", "PS Plus").
- Tapping a card opens the full article in the system browser via `expo-web-browser`.
- Pull-to-refresh.
- "Load more" pagination (fetch next RSS page).
- Empty / error state with retry button if RSS fetch fails.

---

## 7. State Management

| Store | Contents | Implementation |
|---|---|---|
| `AuthContext` | `accessToken`, `refreshToken`, `accountId`, `isAuthenticated`, `signIn()`, `signOut()` | React Context + `expo-secure-store` |
| `UserContext` | Profile (PSN ID, avatar), trophy summary, friend count | React Context, populated on first successful auth |

---

## 8. Service Layer

| Service | Functions | API Source |
|---|---|---|
| `services/psn-auth.ts` | `signIn(npsso)`, `refreshAccessToken(refreshToken)` | `psn-api` auth functions |
| `services/psn-games.ts` | `getLibrary(auth)`, `getRecentlyPlayed(auth)`, `getGameTrophies(auth, titleId)` | `getUserPlayedGames`, `getRecentlyPlayedGames`, `getUserTrophiesForSpecificTitle` |
| `services/psn-trophies.ts` | `getTrophySummary(auth, accountId)`, `getTrophyTitles(auth, accountId)`, `getTitleTrophyDetail(auth, npCommunicationId)` | `getUserTrophyProfileSummary`, `getUserTitles`, `getTitleTrophies`, `getUserTrophiesEarnedForTitle` |
| `services/psn-friends.ts` | `getFriends(auth, accountId)`, `getFriendPresence(auth, accountId)`, `getFriendProfile(auth, accountId)` | `getUserFriendsAccountIds`, `getBasicPresence`, `getProfileFromAccountId` |
| `services/psn-news.ts` | `fetchBlogPosts(page?)` | PS Blog RSS feed + XML parser |

---

## 9. Design System

### 9.1 Brand Colors (extend `constants/theme.ts`)
| Token | Light | Dark |
|---|---|---|
| `psBluePrimary` | `#00439C` | `#0070D1` |
| `psBlueAccent` | `#0070D1` | `#4DA6FF` |
| `trophy.platinum` | `#B0C4DE` | `#C8D8E8` |
| `trophy.gold` | `#D4AF37` | `#FFD700` |
| `trophy.silver` | `#A8A9AD` | `#C0C0C0` |
| `trophy.bronze` | `#CD7F32` | `#E8956D` |

### 9.2 Typography
Use existing `ThemedText` type variants. Add:
- `caption` — 12px, regular, secondary color (for dates, tags)

### 9.3 Components to Build
| Component | Description |
|---|---|
| `PsnAvatar` | Circular avatar image with online status dot |
| `TrophyBadge` | Coloured pill for bronze/silver/gold/platinum |
| `PlatformBadge` | PS5 / PS4 label badge |
| `ProgressRing` | Circular SVG progress indicator (trophy level) |
| `GameCard` | Game cover + metadata row |
| `FriendRow` | Friend avatar + status + currently playing |
| `NewsCard` | Blog post thumbnail + headline card |
| `SkeletonPlaceholder` | Animated loading skeleton for all list items |

---

## 10. Dependencies to Add

| Package | Purpose |
|---|---|
| `psn-api` | PlayStation Network API wrapper |
| `expo-secure-store` | Secure token storage (Keychain / Keystore) |
| `fast-xml-parser` | Parse PS Blog RSS feed |
| `expo-web-browser` | Open news articles in system browser |

---

## 11. Known Limitations & Risks

| Risk | Mitigation |
|---|---|
| PSN unofficial API could break without notice | Abstract all API calls behind the service layer so endpoints can be swapped |
| NPSSO expires every ~2 months | Detect auth errors on API calls and prompt for new NPSSO |
| Friends with private profiles block data | Catch API errors per-friend, show "Private Profile" gracefully |
| No official PSN Store API | Use PS Blog RSS as a proxy for news/deals |
| Rate limiting by Sony (undocumented) | Cache responses in memory during a session; avoid redundant fetches |
| `getUserPlayedGames` and trophy data may be paginated (800 title limit on `getUserTitles`) | Implement offset-based pagination in the service layer |

---

## 12. Out of Scope (MVP)

- PSN Store purchases / game buying
- Push notifications
- PS3 / PS Vita support
- Multiplayer / session joining
- Web platform support
- User-to-user messaging
