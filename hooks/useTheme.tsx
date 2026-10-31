import { useColorScheme } from "react-native";
import { useSettings } from "../store/theme";

export const Colors = {
  light: {
    // Base
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSecondary: "#F5F5F5",
    surfaceElevated: "#FFFFFF",

    // Text
    text: "#171717",
    textSecondary: "#525252",
    textMuted: "#737373",
    textInverse: "#FFFFFF",

    // Brand
    primary: "#171717",
    primaryPressed: "#404040",
    onPrimary: "#FFFFFF",

    // Borders and separators
    border: "#E5E5E5",
    borderStrong: "#D4D4D4",
    divider: "#F0F0F0",

    // Inputs
    inputBackground: "#FFFFFF",
    inputBorder: "#D4D4D4",
    placeholder: "#737373",

    // Interactive states
    ripple: "#E5E5E5",
    overlay: "rgba(0, 0, 0, 0.45)",
    selection: "#E5E5E5",

    // Status
    success: "#15803D",
    successBackground: "#DCFCE7",
    warning: "#A16207",
    warningBackground: "#FEF3C7",
    error: "#B91C1C",
    errorBackground: "#FEE2E2",
    info: "#1D4ED8",
    infoBackground: "#DBEAFE",

    // Images and placeholders
    imagePlaceholder: "#E5E5E5",
    skeleton: "#EEEEEE",
    icon: "#404040",
    iconMuted: "#737373",

    // Navigation
    tabBar: "#FFFFFF",
    tabBarBorder: "#E5E5E5",
    tabActive: "#171717",
    tabInactive: "#737373",

    // Shadows
    shadow: "#000000",
  },

  dark: {
    // Base
    background: "#0A0A0A",
    surface: "#141414",
    surfaceSecondary: "#1F1F1F",
    surfaceElevated: "#262626",

    // Text
    text: "#FAFAFA",
    textSecondary: "#D4D4D4",
    textMuted: "#A3A3A3",
    textInverse: "#171717",

    // Brand
    primary: "#FAFAFA",
    primaryPressed: "#D4D4D4",
    onPrimary: "#171717",

    // Borders and separators
    border: "#292929",
    borderStrong: "#404040",
    divider: "#262626",

    // Inputs
    inputBackground: "#141414",
    inputBorder: "#404040",
    placeholder: "#A3A3A3",

    // Interactive states
    ripple: "#333333",
    overlay: "rgba(0, 0, 0, 0.7)",
    selection: "#404040",

    // Status
    success: "#4ADE80",
    successBackground: "#14532D",
    warning: "#FACC15",
    warningBackground: "#422006",
    error: "#F87171",
    errorBackground: "#450A0A",
    info: "#60A5FA",
    infoBackground: "#172554",

    // Images and placeholders
    imagePlaceholder: "#262626",
    skeleton: "#292929",
    icon: "#D4D4D4",
    iconMuted: "#A3A3A3",

    // Navigation
    tabBar: "#0A0A0A",
    tabBarBorder: "#292929",
    tabActive: "#FAFAFA",
    tabInactive: "#A3A3A3",

    // Shadows
    shadow: "#000000",
  },
} as const;

export type Theme = typeof Colors.dark | typeof Colors.light;

export const useTheme = (): Theme => {
  const colorScheme = useColorScheme();
  const { settings } = useSettings();
  const selectedTheme =
    settings.theme === "system" ? colorScheme : settings.theme;
  return selectedTheme === "dark" ? Colors.dark : Colors.light;
};
