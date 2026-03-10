import { useNavigation, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PsnAvatar } from "@/components/psn-avatar";
import { useThemeColor } from "@/hooks/use-theme-color";
import type { SocialAccountResult } from "psn-api";
import { useSearch } from "./use-search";

function UserRow({
  user,
  onPress,
  text,
  subtle,
}: {
  user: SocialAccountResult;
  onPress: () => void;
  text: string;
  subtle: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: "rgba(255,255,255,0.05)" },
      ]}
    >
      <PsnAvatar
        uri={user.socialMetadata.avatarUrl}
        onlineId={user.socialMetadata.onlineId}
        size={46}
        isOnline={false}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.userName, { color: text }]} numberOfLines={1}>
          {user.socialMetadata.onlineId}
        </Text>
        <Text style={[styles.accountId, { color: subtle }]} numberOfLines={1}>
          ID: {user.socialMetadata.accountId}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: subtle }]}>›</Text>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const bg = useThemeColor({}, "background") as string;
  const text = useThemeColor({}, "text") as string;
  const tint = useThemeColor({}, "tint") as string;
  const subtle = useThemeColor(
    { light: "#8E8E93", dark: "#636366" },
    "icon",
  ) as string;
  const inputBg = useThemeColor(
    { light: "#E5E5EA", dark: "#2C2C2E" },
    "background",
  ) as string;

  const { query, setQuery, results, isLoading, error, handleSearch } =
    useSearch();

  const handleOpenUser = useCallback(
    (user: SocialAccountResult) => {
      router.push({
        pathname: "/friend/[accountId]",
        params: {
          accountId: user.socialMetadata.accountId,
          onlineId: user.socialMetadata.onlineId,
          avatarUrl: user.socialMetadata.avatarUrl,
          isOnline: "0",
          currentlyPlayingTitle: "",
          lastOnlineAt: "",
        },
      });
    },
    [router],
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: "Search by username…",
        hideWhenScrolling: false,
        onChangeText: (event: any) => {
          setQuery(event.nativeEvent.text);
        },
        onSearchButtonPress: (event: any) => {
          handleSearch(event.nativeEvent.text);
        },
        textColor: text,
      },
    });
  }, [navigation, setQuery, handleSearch, text]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {error ? (
        <View style={styles.center}>
          <Text style={[styles.stateTitle, { color: text }]}>{error}</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tint} />
          <Text style={[styles.stateTitle, { color: subtle, marginTop: 12 }]}>
            Searching...
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.socialMetadata.accountId}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index * 40, 400))
                .springify()
                .damping(18)
                .stiffness(130)}
            >
              <UserRow
                user={item}
                onPress={() => handleOpenUser(item)}
                text={text}
                subtle={subtle}
              />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: inputBg }]} />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.stateTitle, { color: subtle }]}>
                {query.length > 0
                  ? "Press Enter to search, or no user found."
                  : "Search for users"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  heading: { fontSize: 30, fontWeight: "700", letterSpacing: -0.6 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 13,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { fontSize: 18, marginRight: 6, lineHeight: 22 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  userName: { fontSize: 15, fontWeight: "600" },
  accountId: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 22, fontWeight: "300", lineHeight: 26, marginTop: -2 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 74 },
  center: { paddingTop: 80, alignItems: "center", gap: 10 },
  stateTitle: { fontSize: 15, fontWeight: "500" },
});
