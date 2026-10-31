import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ToastAndroid,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Container from "../../../components/layout/container";
import * as Sharing from "expo-sharing";
import {
  deleteAssetsAsync,
  requestPermissionsAsync,
} from "expo-media-library/legacy";
import { setWallpaperFromFile } from "react-native-set-live-wallpaper";
import ZoomableImage from "../../../components/ZoomableImage";
import HeaderComponent from "../../../components/layout/header";
import { useTheme } from "@/hooks/useTheme";
const STORAGE_KEY = "@photomart/downloaded_images";
type DownloadedPhoto = {
  id: string;
  uri: string;
  assetId?: string;
  width: number;
  height: number;
  alt_description: string | null;
  username: string;
  downloadedAt: string;
  userImage?: string;
};
type WallpaperTarget = "home" | "lock" | "both";
type SortOption =
  "newest" | "oldest" | "az" | "largest" | "portrait" | "landscape";
export default function DownloadsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [images, setImages] = useState<DownloadedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<DownloadedPhoto | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const loadDownloads = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: DownloadedPhoto[] = stored ? JSON.parse(stored) : [];
      setImages(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Failed to load downloads:", error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, [loadDownloads]),
  );
  const columns = useMemo(() => {
    const sortedImages = [...images];
    switch (sortBy) {
      case "newest":
        sortedImages.sort(
          (a, b) =>
            new Date(b.downloadedAt).getTime() -
            new Date(a.downloadedAt).getTime(),
        );
        break;
      case "oldest":
        sortedImages.sort(
          (a, b) =>
            new Date(a.downloadedAt).getTime() -
            new Date(b.downloadedAt).getTime(),
        );
        break;
      case "az":
        sortedImages.sort((a, b) =>
          (a.alt_description ?? "Untitled image").localeCompare(
            b.alt_description ?? "Untitled image",
          ),
        );
        break;
      case "largest":
        sortedImages.sort((a, b) => b.width * b.height - a.width * a.height);
        break;
      case "portrait":
        sortedImages.sort(
          (a, b) => Number(b.height > b.width) - Number(a.height > a.width),
        );
        break;
      case "landscape":
        sortedImages.sort(
          (a, b) => Number(b.width > b.height) - Number(a.width > a.height),
        );
        break;
    }
    const result: [DownloadedPhoto[], DownloadedPhoto[]] = [[], []];
    const heights = [0, 0];
    for (const photo of sortedImages) {
      const ratio =
        photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
      const estimatedHeight = 180 / ratio + 90;
      const index = heights[0] <= heights[1] ? 0 : 1;
      result[index].push(photo);
      heights[index] += estimatedHeight;
    }
    return result;
  }, [images, sortBy]);
  const notify = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("PhotoMart", message);
    }
  };
  const openImage = (photo: DownloadedPhoto) => {
    setSelectedImage(photo);
    setModalVisible(true);
  };
  const closeImage = () => {
    if (busy) return;
    setModalVisible(false);
    setSelectedImage(null);
  };
  // Remove only from PhotoMart's saved history.
  const removeFromHistory = () => {
    if (!selectedImage || busy) return;
    Alert.alert(
      "Remove from PhotoMart?",
      "This removes the image from your download history only. The gallery image will remain on your device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              const updated = images.filter(
                (photo) => photo.id !== selectedImage.id,
              );
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              setImages(updated);
              setModalVisible(false);
              setSelectedImage(null);
              notify("Removed from download history.");
            } catch (error) {
              console.error("History removal failed:", error);
              Alert.alert("Error", "Could not update download history.");
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };
  // Permanently delete the corresponding media-library asset.
  const deleteFromDevice = () => {
    if (!selectedImage || busy) return;
    if (!selectedImage.assetId) {
      Alert.alert(
        "Gallery asset unavailable",
        "This saved record does not contain a gallery asset ID. It can be removed from PhotoMart history, but cannot safely be deleted from your gallery through this record.",
      );
      return;
    }
    Alert.alert(
      "Delete from device?",
      "This will request deletion of the image from your device's media library. This action may be irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete image",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              const permission = await requestPermissionsAsync(true, ["photo"]);
              if (!permission.granted) {
                Alert.alert(
                  "Permission required",
                  "Allow photo library access to delete this image.",
                );
                return;
              }
              const success = await deleteAssetsAsync([selectedImage.assetId!]);
              if (!success) {
                throw new Error("The gallery did not confirm deletion.");
              }
              const updated = images.filter(
                (photo) => photo.id !== selectedImage.id,
              );
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              setImages(updated);
              setModalVisible(false);
              setSelectedImage(null);
              notify("Image deleted from device and history.");
            } catch (error) {
              console.error("Gallery deletion failed:", error);
              Alert.alert(
                "Delete failed",
                error instanceof Error
                  ? error.message
                  : "The image could not be deleted.",
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };
  const shareImage = async () => {
    if (!selectedImage || busy) return;
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Unavailable", "Sharing is not available on this device.");
        return;
      }
      await Sharing.shareAsync(selectedImage.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Share image",
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      Alert.alert("Share failed", "Could not share this image.");
    }
  };
  const chooseWallpaper = () => {
    if (!selectedImage || busy) return;
    const applyWallpaper = async (target: WallpaperTarget) => {
      setBusy(true);
      try {
        const result = await setWallpaperFromFile({
          source: selectedImage.uri,
          target,
        });
        if (result.status === "cancelled") {
          notify("Wallpaper setup cancelled.");
        } else if (result.status === "requires-user-action") {
          notify(
            Platform.OS === "ios"
              ? "Continue in Photos to finish setting your wallpaper."
              : "Finish setting your wallpaper in the system screen.",
          );
        } else {
          notify("Wallpaper action completed.");
        }
      } catch (error) {
        console.error("Wallpaper setup failed:", error);
        Alert.alert(
          "Wallpaper failed",
          error instanceof Error
            ? error.message
            : "Could not prepare this wallpaper.",
        );
      } finally {
        setBusy(false);
      }
    };
    Alert.alert("Set wallpaper", "Where would you like to use this image?", [
      {
        text: "Home screen",
        onPress: () => applyWallpaper("home"),
      },
      {
        text: "Lock screen",
        onPress: () => applyWallpaper("lock"),
      },
      {
        text: "Both screens",
        onPress: () => applyWallpaper("both"),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };
  const renderPhoto = (photo: DownloadedPhoto) => {
    const ratio =
      photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;
    return (
      <Pressable
        key={photo.id}
        style={styles.card}
        onPress={() => openImage(photo)}
      >
        <Image
          source={{ uri: photo.uri }}
          style={[styles.photo, { aspectRatio: ratio }]}
          resizeMode="cover"
        />
        <Text
          style={[styles.photoDescription, { color: theme.text }]}
          numberOfLines={2}
          className="text-xs"
        >
          {photo.alt_description ?? "Untitled image"}
        </Text>
        <Text style={styles.creator} numberOfLines={1}>
          {photo.username}
        </Text>
        <Text style={styles.date}>
          {new Date(photo.downloadedAt).toLocaleDateString()}
        </Text>
      </Pressable>
    );
  };
  return (
    <Container>
      <HeaderComponent title="Downloads" />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.text} />
          </View>
        ) : images.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="download" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
              Nothing saved yet
            </Text>
            <Text
              style={[styles.emptyDescription, { color: theme.textSecondary }]}
            >
              Save your favorite images and they will appear here.
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sortScroll}
              contentContainerStyle={styles.sortContainer}
            >
              {(
                [
                  ["newest", "Newest", "clock"],
                  ["oldest", "Oldest", "calendar"],
                  ["az", "A–Z", "chevrons-down"],
                  ["largest", "Largest", "maximize"],
                  ["portrait", "Portrait", "smartphone"],
                  ["landscape", "Landscape", "monitor"],
                ] as const
              ).map(([value, label, icon]) => {
                const active = sortBy === value;

                return (
                  <Pressable
                    key={value}
                    onPress={() => setSortBy(value)}
                    style={[
                      styles.sortChip,
                      {
                        borderColor: theme.border,
                        borderWidth: 1,
                        backgroundColor: active ? theme.primary : theme.surface,
                      },
                    ]}
                  >
                    <Feather
                      name={icon}
                      size={14}
                      color={active ? theme.onPrimary : theme.textSecondary}
                    />

                    <Text
                      style={[
                        styles.sortChipText,
                        { color: active ? theme.onPrimary : theme.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.masonry}>
                {columns.map((column, index) => (
                  <View
                    key={index}
                    style={[
                      styles.column,
                      index === 0 ? { marginRight: 6 } : { marginLeft: 6 },
                    ]}
                  >
                    {column.map(renderPhoto)}
                  </View>
                ))}
              </View>
              <View style={[styles.info, {borderTopColor:theme.border}]}>
                <Feather name="info" size={17} color={theme.textSecondary} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Removing an image from PhotoMart only removes its
                  download-history record. Use Delete from device if you also
                  want to remove the gallery asset.
                </Text>
              </View>
            </ScrollView>
          </>
        )}
        {/* Image details and actions */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={closeImage}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable
                onPress={closeImage}
                disabled={busy}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Image details</Text>
              <View style={{ width: 40 }} />
            </View>
            {selectedImage && (
              <ScrollView
                contentContainerStyle={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* <Image
                  source={{ uri: selectedImage.uri }}
                  style={[
                    styles.preview,
                    {
                      aspectRatio:
                        selectedImage.width > 0 && selectedImage.height > 0
                          ? selectedImage.width / selectedImage.height
                          : 1,
                    },
                  ]}
                  resizeMode="contain"
                /> */}
                <View style={styles.preview}>
                  <ZoomableImage uri={selectedImage.uri} />
                </View>
                <Text style={styles.detailDescription}>
                  {selectedImage.alt_description ?? "Untitled image"}
                </Text>
                <View className="flex-row justify-between">
                  <View style={styles.metadata}>
                    <Feather name="user" size={17} color={theme.textSecondary} />
                    <Text style={styles.metadataText}>
                      {selectedImage.username}
                    </Text>
                  </View>
                  <View style={styles.metadata}>
                    <Feather name="calendar" size={17} color={theme.textSecondary} />
                    <Text style={styles.metadataText}>
                      Saved{" "}
                      {new Date(
                        selectedImage.downloadedAt,
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.metadata}>
                    <Feather name="maximize" size={17} color={theme.textSecondary} />
                    <Text style={styles.metadataText}>
                      {selectedImage.width} × {selectedImage.height}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionTitle}>Actions</Text>
                <ActionRow
                  theme={theme}
                  styles={styles}
                  icon="smartphone"
                  title="Set wallpaper"
                  subtitle="Home screen, lock screen or both"
                  onPress={chooseWallpaper}
                  disabled={busy}
                />
                <ActionRow
                  theme={theme}
                  styles={styles}
                  icon="share-2"
                  title="Share image"
                  subtitle="Share with another app"
                  onPress={shareImage}
                  disabled={busy}
                />
                <ActionRow
                  theme={theme}
                  styles={styles}
                  icon="bookmark"
                  title="Remove from PhotoMart"
                  subtitle="Keep the image in your gallery"
                  onPress={removeFromHistory}
                  disabled={busy}
                />
                <ActionRow
                  theme={theme}
                  styles={styles}
                  icon="trash-2"
                  title="Delete from device"
                  subtitle="Remove the gallery image"
                  danger
                  onPress={deleteFromDevice}
                  disabled={busy}
                />
                {busy && (
                  <ActivityIndicator
                    style={{ marginVertical: 16 }}
                    color={theme.text}
                  />
                )}
                <Text style={styles.footerNote}>
                  Gallery deletion is permanent where supported. You may be
                  asked to confirm it by your device.
                </Text>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </View>
    </Container>
  );
}
type ActionRowProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
};
function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
  disabled = false,
  theme,
  styles,
}: ActionRowProps) {
  const color = danger ? theme.error : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row justify-between items-center gap-2 my-2"
    >
      <View
        style={[
          styles.actionIcon,
          danger && { backgroundColor: theme.errorBackground },
        ]}
      >
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color }]}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={19} color={theme.textMuted} />
    </Pressable>
  );
}
function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
  sortScroll: {
    flexGrow: 0,
    marginBottom: 18,
    paddingInline: 10,
  },

  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },

  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },

  sortChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },

  sortChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textSecondary,
  },

  sortChipTextActive: {
    color: theme.onPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heading: {
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: theme.text,
  },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 14,
    backgroundColor: theme.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.text,
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: theme.textSecondary,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  masonry: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    marginBottom: 18,
  },
  photo: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: theme.imagePlaceholder,
  },
  photoDescription: {
    marginTop: 8,
        lineHeight: 19,
    fontWeight: "500",
    color: theme.text,
  },
  creator: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    color: theme.textSecondary,
  },
  date: {
    marginTop: 3,
    fontSize: 11,
    color: theme.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: theme.text,
    marginTop: 18,
  },
  emptyDescription: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: theme.textSecondary,
    marginTop: 8,
  },
  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    paddingTop: 16,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.text,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 32,
  },
  preview: {
    width: "100%",
    height: 420,
    borderRadius: 14,
    backgroundColor: theme.imagePlaceholder,
    overflow: "hidden",
  },
  detailDescription: {
    marginTop: 16,
    marginBottom: 12,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: theme.text,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  metadataText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
  },
  actionRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: theme.textSecondary,
  },
  footerNote: {
    marginTop: 18,
    fontSize: 12,
    lineHeight: 18,
    color: theme.textMuted,
  },
  });
}
