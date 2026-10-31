import { Feather } from "@expo/vector-icons";

export type SettingRowProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  rightText?: string;
};