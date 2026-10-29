import {
  View,
  Text,
  Image,
  FlatList,
  ToastAndroid,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from "react-native";

import { useCallback, useEffect, useRef, useState } from "react";

import { router, useLocalSearchParams } from "expo-router";
import Container from "../../../components/layout/container";
import { Feather } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { File, Paths } from "expo-file-system";
import {
  createAssetAsync,
  requestPermissionsAsync,
} from "expo-media-library/legacy";
import { setWallpaperFromUrl } from "react-native-set-live-wallpaper";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  updated_at: string;
  alt_description: string | null;
  urls: {
    regular: string;
    full: string;
  };
  user: {
    name: string;
    profile_image: {
      medium: string;
    };
    username: string;
  };
};
const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

export default function TopicScreen() {
  const { topic, topicName } = useLocalSearchParams<{
    topic?: string | string[];
    topicName?: string | string[];
  }>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const topicSlug = Array.isArray(topic) ? topic[0] : topic;
  const title = Array.isArray(topicName) ? topicName[0] : topicName;
  const [images, setImages] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(
    null,
  );
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ["60%", "40%"];

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Bottom sheet index:", index);

    if (index === -1) {
      setSelectedPhoto(null);
    }
  }, []);

  const openOptions = useCallback((photo: UnsplashPhoto) => {
    setSelectedPhoto(photo);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const closeOptions = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    [],
  );

  const saveImage = async () => {
    if (!selectedPhoto || saving) return;
    try {
      ToastAndroid.show("Image saving...", ToastAndroid.SHORT);
      setSaving(true);
      if (!ACCESS_KEY) {
        throw new Error("Unsplash API key is missing.");
      }
      // Unsplash requires this endpoint to be triggered when a user downloads.
      const trackResponse = await fetch(
        `https://api.unsplash.com/photos/${selectedPhoto.id}/download`,
        {
          headers: {
            Authorization: `Client-ID ${ACCESS_KEY}`,
            "Accept-Version": "v1",
          },
        },
      );

      if (!trackResponse.ok) {
        throw new Error(`Unsplash API error: ${trackResponse.status}`);
      }

      const downloadData: { url: string } = await trackResponse.json();
      const destination = new File(
        Paths.cache,
        `photomart-${selectedPhoto.id}-${Date.now()}.jpg`,
      );
      const downloadedFile = await File.downloadFileAsync(
        downloadData.url,
        destination,
      );

      const permission = await requestPermissionsAsync(true, ["photo"]);
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow photo library access to save images.",
        );
        return;
      }
      const asset = await createAssetAsync(downloadedFile.uri);

      const storageKey = "@photomart/downloaded_images";

      const existingData = await AsyncStorage.getItem(storageKey);

      const downloadedImages = existingData ? JSON.parse(existingData) : [];

      const alreadySaved = downloadedImages.some(
        (photo: { id: string }) => photo.id === selectedPhoto.id,
      );

      if (!alreadySaved) {
        downloadedImages.unshift({
          id: selectedPhoto.id,
          uri: asset.uri,
          width: selectedPhoto.width,
          height: selectedPhoto.height,
          alt_description: selectedPhoto.alt_description,
          username: selectedPhoto.user.username,
          userImage: selectedPhoto.user.profile_image.medium,
          downloadedAt: new Date().toISOString(),
        });

        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(downloadedImages),
        );
      }

      ToastAndroid.show("Image saved to library.", ToastAndroid.SHORT);
    } catch (err) {
      console.error("Image download failed:", err);
      Alert.alert(
        "Download failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const shareImage = async () => {
    if (!selectedPhoto || sharing) return;

    try {
      setSharing(true);

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not available on this device.",
        );
        return;
      }

      const destination = new File(
        Paths.cache,
        `photomart-share-${selectedPhoto.id}-${Date.now()}.jpg`,
      );
      const downloadedFile = await File.downloadFileAsync(
        selectedPhoto.urls.full,
        destination,
      );

      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Share Image",
        UTI: "public.jpeg",
      });
    } catch (err) {
      console.error("Image sharing failed:", err);
    } finally {
      setSharing(false);
    }
  };

  const setWallpaper = async () => {
    if (!selectedPhoto || settingWallpaper) return;

    try {
      setSettingWallpaper(true);
      await setWallpaperFromUrl({
        source: selectedPhoto.urls.full,
        target: "both",
      });
    } catch (err) {
      console.error("Setting wallpaper failed:", err);
      Alert.alert(
        "Wallpaper failed",
        err instanceof Error ? err.message : "Unable to set wallpaper.",
      );
    } finally {
      setSettingWallpaper(false);
    }
  };

  useEffect(() => {
    if (!topicSlug) return;
    let cancelled = false;
    const loadImages = async () => {
      setLoading(true);

      try {
        const baseURL = process.env.EXPO_PUBLIC_UNSPLASH_URL?.replace(
          /\/+$/,
          "",
        );
        const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

        if (!baseURL || !accessKey) {
          throw new Error("Unsplash API configuration is missing");
        }
        const apiURL = `${baseURL}/topics/${encodeURIComponent(topicSlug)}/photos`;
        const response = await fetch(apiURL, {
          method: "GET",
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            "Accept-Version": "v1",
          },
        });

        if (!response.ok) {
          const errorBody = await response.text();

          console.error("Unsplash API error:", response.status, errorBody);

          if (!cancelled) {
            setImages([]);

            ToastAndroid.show(
              `API Error: ${response.status}`,
              ToastAndroid.SHORT,
            );
          }

          return;
        }

        const data: UnsplashPhoto[] = await response.json();

        if (!cancelled) {
          setImages(data);
        }
      } catch (error) {
        console.error("Failed to load topic images:", error);

        if (!cancelled) {
          ToastAndroid.show("Failed to load images", ToastAndroid.SHORT);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [topicSlug]);

  return (
    <Container>
      <View className="flex-1 p-2">
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color="#111827" />
          </Pressable>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {title ?? topicSlug ?? "Topic"}
          </Text>

          <View style={styles.headerRight} />
        </View>

        {/* Images */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        ) : (
          <FlatList
            data={images}
            keyExtractor={(item) => item.id}
            contentContainerStyle={
              images.length === 0 ? styles.emptyList : styles.listContent
            }
            renderItem={({ item }) => (
              <View style={styles.photoCard}>
                {/* Photo author */}
                <View style={styles.authorRow}>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexShrink: 1,
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/user/[username]",
                        params: { username: item.user.username },
                      })
                    }
                  >
                    <Image
                      source={{
                        uri: item.user.profile_image.medium,
                      }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />

                    <View style={styles.authorInfo}>
                      <Text style={styles.username} numberOfLines={1}>
                        {item.user.username}
                      </Text>

                      <Text style={styles.date}>
                        {new Date(item.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </Pressable>

                  {/* More options */}
                  <Pressable
                    onPress={() => openOptions(item)}
                    style={styles.menuButton}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`More options for ${item.alt_description ?? "image"}`}
                  >
                    <Feather name="more-horizontal" size={24} color="#111827" />
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: "/detail/[id]",
                      params: { id: item.id },
                    });
                  }}
                >
                  {/* Main photo */}
                  <Image
                    source={{ uri: item.urls.regular }}
                    style={[
                      styles.photo,
                      {
                        aspectRatio: item.width / item.height,
                      },
                    ]}
                    resizeMode="cover"
                  />

                  {/* Photo description */}
                  <Text style={styles.description}>
                    {item.alt_description ?? "Untitled image"}
                  </Text>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No images found.</Text>
            }
          />
        )}

        {/* Image Options Bottom Sheet */}
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Image options</Text>

          {selectedPhoto && (
            <Text style={styles.selectedUsername}>
              Photo by {selectedPhoto.user.name}
            </Text>
          )}

          <Pressable style={styles.option} onPress={saveImage}>
            <Feather name="download" size={20} color="#111827" />
            <Text style={styles.optionText}>Download image</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={shareImage}>
            <Feather name="share-2" size={20} color="#111827" />
            <Text style={styles.optionText}>Share image</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={setWallpaper}>
            <Feather name="image" size={20} color="#111827" />
            <Text style={styles.optionText}>Set as wallpaper</Text>
          </Pressable>

          <Pressable
            style={[styles.option, styles.cancelOption]}
            onPress={closeOptions}
          >
            <Feather name="x" size={20} color="#DC2626" />
            <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  headerRight: {
    width: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },

  photoCard: {
    marginBottom: 20,
    overflow: "hidden",
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
    width: "100%",
    justifyContent: "space-between",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },

  authorInfo: {
    flex: 1,
  },

  username: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  date: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 3,
  },

  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },

  photo: {
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },

  description: {
    paddingHorizontal: 4,
    paddingTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
  },

  emptyText: {
    padding: 16,
    textAlign: "center",
    color: "#6B7280",
  },

  sheetBackground: {
    backgroundColor: "#FFFFFF",
  },

  sheetIndicator: {
    backgroundColor: "#D1D5DB",
    width: 40,
  },

  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  selectedUsername: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },

  cancelOption: {
    marginTop: 4,
  },

  cancelText: {
    color: "#DC2626",
  },
});
