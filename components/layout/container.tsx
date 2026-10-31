import { View, StatusBar } from "react-native";
import React, { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";

export default function Container({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <View className=" flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar
        barStyle={
          theme.background === "#0A0A0A" ? "light-content" : "dark-content"
        }
      />
      <SafeAreaView style={{ flex: 1, padding: 5 }} edges={{ top: "additive" }}>
        {children}
      </SafeAreaView>
    </View>
  );
}
