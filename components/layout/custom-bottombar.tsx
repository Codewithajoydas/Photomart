import { View, Text, Pressable } from "react-native";
import React from "react";
import { BottomTabBarProps } from "expo-router/build/layouts/TabsClient.js";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type TabItemProps = {
  item: BottomTabBarProps["state"]["routes"][number];
  isFocused: boolean;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
};

function TabItem({ item, isFocused, theme, onPress }: TabItemProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const icons: Record<string, keyof typeof Feather.glyphMap> = {
    index: "home",
    category: "box",
    settings: "settings",
    downloads: "download",
  };

  const handlePressIn = () => {
    scale.value = withSpring(1.2);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="flex justify-center items-center flex-col"
    >
      <Animated.View
        style={[
          {
            backgroundColor: isFocused ? theme.tabBarBorder : theme.surface,
            paddingHorizontal: 20,
            paddingVertical: 5,
            borderRadius: 100,
            borderWidth: 0.4,
            borderColor: isFocused ? theme.borderStrong : "transparent",
          },
          animatedStyle,
        ]}
      >
        <Feather
          name={icons[item.name] || "circle"}
          size={20}
          color={theme.text}
        />
      </Animated.View>

      <Text
        className="capitalize text-sm"
        style={{
          fontWeight: isFocused ? "bold" : "normal",
          color: theme.text,
        }}
      >
        {item.name}
      </Text>
    </Pressable>
  );
}

export default function CustomBottomBar({
  state,
  descriptors,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const theme = useTheme();

  return (
    <View
      className="flex flex-row justify-between items-center gap-2 p-2 px-5"
      style={{
        paddingBottom: insets.bottom,
        backgroundColor: theme.surface,
        borderTopWidth: 1,
        borderColor: theme.border,
      }}
    >
      {state.routes.map((item, index) => {
        const isFocused = state.index === index;

        return (
          <TabItem
            key={item.key}
            item={item}
            isFocused={isFocused}
            theme={theme}
            onPress={() => {
              navigateToTab(item.key);
            }}
          />
        );
      })}
    </View>
  );
}
