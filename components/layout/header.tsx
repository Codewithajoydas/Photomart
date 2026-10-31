import { View, Text, Pressable } from "react-native";
import React from "react";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

export default function HeaderComponent({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View className="flex-row items-center justify-between mb-1 py-2 p-2">
      <View className="flex-col">
        <Text className="text-2xl font-bold" style={{ color: theme.text }}>
          {title}
        </Text>
        <Text className="text-xs" style={{ color: theme.textSecondary }}>
          The Ultimate Collection
        </Text>
      </View>
      {/* <Pressable>
        <Feather name="menu" size={24}/>
      </Pressable> */}
    </View>
  );
}
