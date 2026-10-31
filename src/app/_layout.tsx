import { Stack } from "expo-router";
import "../../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PortalHost } from "@rn-primitives/portal";
import { SettingsProvider } from "../../store/theme";
import { useTheme } from "../../hooks/useTheme";

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AppNavigator />
    </SettingsProvider>
  );
}

function AppNavigator() {
  const theme = useTheme();

  return (
    <GestureHandlerRootView className="flex-1">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <PortalHost />
    </GestureHandlerRootView>
  );
}
