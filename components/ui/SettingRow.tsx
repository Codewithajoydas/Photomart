import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { SettingRowProps } from "../../types/components/SettingRowProps";
import { Feather } from "@expo/vector-icons";
export function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
  rightText,
}: SettingRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={[styles.settingRow, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconBox,
          danger && styles.dangerIconBox,
          { backgroundColor: theme.border, borderRadius: 10 },
        ]}
      >
        <Feather
          name={icon}
          size={19}
          color={danger ? "#DC2626" : theme.textSecondary}
        />
      </View>

      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowTitle,
            danger && styles.dangerText,
            { color: theme.text },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightText ? (
        <Text style={[styles.rightText, { color: theme.text }]}>
          {rightText}
        </Text>
      ) : (
        <Feather name="chevron-right" size={19} color={theme.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    padding: 2,
    borderRadius: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#858585",
  },
  rightText: {
    fontSize: 12,
    color: "#737373",
    fontWeight: "600",
  },
  dangerIconBox: {
    backgroundColor: "#FEF2F2",
  },
  dangerText: {
    color: "#DC2626",
  },
});
