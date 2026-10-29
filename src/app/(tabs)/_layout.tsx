import { View, Text } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import CustomBottomBar from "../../../components/layout/custom-bottombar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ ...props }) => <CustomBottomBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="category" />
      <Tabs.Screen name="downloads" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
