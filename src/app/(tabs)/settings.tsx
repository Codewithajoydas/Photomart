import React from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import HeaderComponent from "../../../components/layout/header";
import Container from "../../../components/layout/container";
import { useTheme } from "../../../hooks/useTheme";
import { useSettings } from "../../../store/theme";
import { SettingRow } from "../../../components/ui/SettingRow";

export default function Settings() {
  const router = useRouter();
  const theme = useTheme();
  const { settings, settingsLoaded, updateSettings } = useSettings();
  const showComingSoon = (feature: string) => {
    Alert.alert(feature, "This feature is not configured yet.");
  };

  const selectGalleryLayout = () => {
    Alert.alert("Gallery layout", "Choose how photos are displayed.", [
      {
        text: "Masonry",
        onPress: () => void updateSettings({ grid_layout: "masonry" }),
      },
      {
        text: "Grid",
        onPress: () => void updateSettings({ grid_layout: "grid" }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <Container>
      <HeaderComponent title="Settings" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        {/* <Pressable
          style={[
            styles.profileCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => showComingSoon("Profile")}
        >
          <View style={[styles.avatar, { backgroundColor: theme.border }]}>
            <Feather name="user" size={25} color={theme.textSecondary} />
          </View>
          <View style={[styles.profileContent, { borderColor: theme.border }]}>
            <Text style={[styles.profileTitle, { color: theme.text }]}>
              Your account
            </Text>
            <Text style={[styles.profileSubtitle, { color: theme.textMuted }]}>
              Manage your profile and preferences
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textMuted} />
        </Pressable> */}
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.border }]}>
              <Feather name="moon" size={19} color={theme.textSecondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Dark mode
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Use a darker appearance
              </Text>
            </View>
            <Switch
              value={
                settings.theme === "dark" ||
                (settings.theme === "system" &&
                  theme.background === "#0A0A0A")
              }
              disabled={!settingsLoaded}
              onValueChange={(enabled) =>
                void updateSettings({ theme: enabled ? "dark" : "light" })
              }
              trackColor={{ false: theme.border, true: theme.text }}
              thumbColor={theme.tabInactive}
            />
          </View>
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          />
          <SettingRow
            icon="grid"
            title="Gallery layout"
            subtitle="Choose how images are displayed"
            rightText={settings.grid_layout === "masonry" ? "Masonry" : "Grid"}
            onPress={settingsLoaded ? selectGalleryLayout : undefined}
          />
        </View>
        {/* Downloads */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Downloads
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SettingRow
            icon="download"
            title="Download history"
            subtitle="View your saved images"
            onPress={() => router.push("/downloads")}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          />
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.border }]}>
              <Feather name="save" size={19} color={theme.textSecondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Auto-download
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Automatically save selected images
              </Text>
            </View>
            <Switch
              value={settings.auto_download}
              disabled={!settingsLoaded}
              onValueChange={(enabled) =>
                void updateSettings({ auto_download: enabled })
              }
              trackColor={{ false: theme.border, true: theme.text }}
              thumbColor={theme.tabInactive}
            />
          </View>
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          />
          <SettingRow
            icon="hard-drive"
            title="Storage"
            subtitle="Manage downloaded images"
            onPress={() => showComingSoon("Storage")}
          />
        </View>
        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Notifications
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.border }]}>
              <Feather name="bell" size={19} color={theme.textSecondary} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>
                Notifications
              </Text>
              <Text
                style={[styles.rowSubtitle, { color: theme.textSecondary }]}
              >
                Receive app notifications
              </Text>
            </View>
            <Switch
              value={settings.notifications}
              disabled={!settingsLoaded}
              onValueChange={(enabled) =>
                void updateSettings({ notifications: enabled })
              }
              trackColor={{ false: theme.border, true: theme.text }}
              thumbColor={theme.tabInactive}
            />
          </View>
        </View>
        {/* Privacy */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Privacy & support
        </Text>
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SettingRow
            icon="shield"
            title="Privacy policy"
            subtitle="Learn how your data is handled"
            onPress={() => showComingSoon("Privacy policy")}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          />
          <SettingRow
            icon="help-circle"
            title="Help & support"
            subtitle="Get help with PhotoMart"
            onPress={() => showComingSoon("Help & support")}
          />
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.surfaceSecondary },
            ]}
          />
          <SettingRow
            icon="info"
            title="About PhotoMart"
            subtitle="App details and version"
            rightText="1.0.0"
            onPress={() => showComingSoon("About PhotoMart")}
          />
        </View>
      </ScrollView>
    </Container>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#737373",
    marginBottom: 7,
  },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#171717",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#737373",
    marginTop: 5,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 27,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  profileContent: {
    flex: 1,
    marginLeft: 13,
  },
  profileTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  profileSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 11,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 25,
  },
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
  separator: {
    height: 1,
    backgroundColor: "#F1F1F1",
  },
  dangerIconBox: {
    backgroundColor: "#FEF2F2",
  },
  dangerText: {
    color: "#DC2626",
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 15,
  },
  footerLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
  },
  footerSubtitle: {
    fontSize: 12,
    color: "#858585",
    marginTop: 4,
  },
  version: {
    marginTop: 12,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#A3A3A3",
  },
});
