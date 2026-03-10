import { useThemeColor } from "@/hooks/use-theme-color";
import { Stack } from "expo-router";

export default function SearchLayout() {
  const bg = useThemeColor({}, "background") as string;
  const text = useThemeColor({}, "text") as string;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Search",
          headerLargeTitle: true,
          headerStyle: {
            backgroundColor: bg,
          },
          headerTintColor: text,
          headerSearchBarOptions: {
            placeholder: "Search by username...",
            hideWhenScrolling: false,
          },
        }}
      />
    </Stack>
  );
}
