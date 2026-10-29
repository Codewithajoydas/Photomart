import { View, Text, StatusBar } from "react-native";
import React, { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Container({ children }: PropsWithChildren) {
  return (
        <View className="bg-white flex-1">
          <StatusBar barStyle="dark-content" />
          <SafeAreaView
            style={{ flex: 1, padding: 5 }}
            edges={{ top: "additive" }}
          >
            {children}
          </SafeAreaView>
        </View>
  );
}
