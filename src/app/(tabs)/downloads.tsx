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

export default function DownloadsScreen() {
  const [images, setImages] = useState<DownloadedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<DownloadedPhoto | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);

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
    const result: [DownloadedPhoto[], DownloadedPhoto[]] = [[], []];

    const heights = [0, 0];

    for (const photo of images) {
      const ratio =
        photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1;

      const estimatedHeight = 180 / ratio + 90;
      const index = heights[0] <= heights[1] ? 0 : 1;

      result[index].push(photo);
      heights[index] += estimatedHeight;
    }

    return result;
  }, [images]);

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

        <Text style={styles.photoDescription} numberOfLines={2}>
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
      <View style={styles.container}>
        {/* Page header */}
        <View style={styles.header}>
          <View style={styles.headingRow}>
            <Text style={styles.heading}>Downloads</Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{images.length}</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>Your saved collection</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#111111" />
          </View>
        ) : images.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="download" size={40} color="#777777" />

            <Text style={styles.emptyTitle}>Nothing saved yet</Text>

            <Text style={styles.emptyDescription}>
              Save your favourite images and they will appear here.
            </Text>
          </View>
        ) : (
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

            <View style={styles.info}>
              <Feather name="info" size={17} color="#777777" />

              <Text style={styles.infoText}>
                Removing an image from PhotoMart only removes its
                download-history record. Use Delete from device if you also want
                to remove the gallery asset.
              </Text>
            </View>
          </ScrollView>
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
                <Feather name="x" size={24} color="#111111" />
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
                    <Feather name="user" size={17} color="#6B7280" />
                    <Text style={styles.metadataText}>
                      {selectedImage.username}
                    </Text>
                  </View>

                  <View style={styles.metadata}>
                    <Feather name="calendar" size={17} color="#6B7280" />
                    <Text style={styles.metadataText}>
                      Saved{" "}
                      {new Date(
                        selectedImage.downloadedAt,
                      ).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.metadata}>
                    <Feather name="maximize" size={17} color="#6B7280" />
                    <Text style={styles.metadataText}>
                      {selectedImage.width} × {selectedImage.height}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Actions</Text>

                <ActionRow
                  icon="smartphone"
                  title="Set wallpaper"
                  subtitle="Home screen, lock screen or both"
                  onPress={chooseWallpaper}
                  disabled={busy}
                />

                <ActionRow
                  icon="share-2"
                  title="Share image"
                  subtitle="Share with another app"
                  onPress={shareImage}
                  disabled={busy}
                />

                <ActionRow
                  icon="bookmark"
                  title="Remove from PhotoMart"
                  subtitle="Keep the image in your gallery"
                  onPress={removeFromHistory}
                  disabled={busy}
                />

                <ActionRow
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
                    color="#111111"
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
};

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
  disabled = false,
}: ActionRowProps) {
  const color = danger ? "#DC2626" : "#111111";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row justify-between items-center gap-2 my-2"
    >
      <View
        style={[styles.actionIcon, danger && { backgroundColor: "#FEF2F2" }]}
      >
        <Feather name={icon} size={20} color={color} />
      </View>

      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color }]}>{title}</Text>

        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Feather name="chevron-right" size={19} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: "#111111",
  },

  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 14,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#777777",
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
    backgroundColor: "#F3F4F6",
  },

  photoDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    color: "#292929",
  },

  creator: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#555555",
  },

  date: {
    marginTop: 3,
    fontSize: 11,
    color: "#999999",
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
    color: "#111111",
    marginTop: 18,
  },

  emptyDescription: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#777777",
    marginTop: 8,
  },

  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 16,
    marginTop: 4,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#777777",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  modalHeader: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
    color: "#111111",
  },

  modalScroll: {
    padding: 20,
    paddingBottom: 32,
  },


preview: {
  width: "100%",
  height: 420,
  borderRadius: 14,
  backgroundColor: "#F3F4F6",
  overflow: "hidden",
},


  detailDescription: {
    marginTop: 16,
    marginBottom: 12,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#111111",
  },

  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  metadataText: {
    fontSize: 13,
    color: "#666666",
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },

  actionRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F4F4F4",
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
    color: "#777777",
  },

  footerNote: {
    marginTop: 18,
    fontSize: 12,
    lineHeight: 18,
    color: "#888888",
  },
});
