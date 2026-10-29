import { View, Text, Pressable } from "react-native";
import React from "react";
import { BottomTabBarProps } from "expo-router/build/layouts/TabsClient.js";
import { Feather } from "@expo/vector-icons";

export default function CustomBottomBar({
  state,
  navigateToTab,
  descriptors,
  insets,
}: BottomTabBarProps) {
  const icons: Record<string, keyof typeof Feather.glyphMap> = {
    index: "home",
    category: "box",
    settings: "settings",
    downloads: "download",
  };
  return (
    <View
      className="flex flex-row justify-between items-center gap-2 p-2 px-5 bg-white border-t border-gray-200"
      style={{ paddingBottom: insets.bottom }}
    >
      {state.routes.map((item, index) => {
        const isFocused = state.index === index;
        return (
          <Pressable
            onPress={() => navigateToTab(item.key)}
            className="flex justify-center items-center flex-col"
          >
            <View
              style={{
                backgroundColor: isFocused ? "lightgray" : "white",
                paddingInline: 20,
                paddingBlock: 5,
                borderRadius: 100,
                borderWidth: 0.4,
                borderColor: isFocused ? "gray" : "transparent",
              }}
            >
              <Feather name={icons[item.name]} size={20} />
            </View>
            <Text
              className="capitalize text-sm"
              style={{ fontWeight: isFocused ? "bold" : "normal" }}
            >
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
