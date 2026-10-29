import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  useWindowDimensions,
  FlatList,
  Alert,
  ToastAndroid,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Sharing from "expo-sharing";
import Container from "../../../components/layout/container";
import { File, Paths } from "expo-file-system";
import {
  createAssetAsync,
  requestPermissionsAsync,
} from "expo-media-library/legacy";
import { setWallpaperFromUrl } from "react-native-set-live-wallpaper";

type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  color: string | null;
  alt_description: string | null;
  description: string | null;
  urls: {
    regular: string;
    full: string;
    small?: string;
    thumb?: string;
  };
  views?: number | string;
  likes?: number | string;
  downloads?: number | string;
  user: {
    name: string;
    username: string;
    profile_image: {
      medium: string;
    };
    links: {
      html: string;
    };
  };
  tags: {
    type: string;
    title: string;
  }[];
};

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

function showMessage(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert("", message);
  }
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

  const [image, setImage] = useState<UnsplashPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [settingWallpaper, setSettingWallpaper] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [userPosts, setUserPosts] = useState<UnsplashPhoto[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);

  // Fetch the selected photo.
  useEffect(() => {
    if (!id) {
      setError("Photo ID is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadImage() {
      try {
        setLoading(true);
        setError(null);
        setImage(null);

        if (!ACCESS_KEY) {
          throw new Error("Unsplash API key is missing.");
        }

        const response = await fetch(
          `https://api.unsplash.com/photos/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Client-ID ${ACCESS_KEY}`,
              "Accept-Version": "v1",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Photo not found."
              : `Unable to load photo (${response.status}).`,
          );
        }

        const data: UnsplashPhoto = await response.json();

        if (!cancelled) {
          setImage(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch other photos uploaded by the same photographer.
  useEffect(() => {
    const username = image?.user.username;
    if (!username || !ACCESS_KEY) return;

    let cancelled = false;

    async function loadUserPosts() {
      try {
        setPostsLoading(true);

        const response = await fetch(
          `https://api.unsplash.com/users/${encodeURIComponent(
            username as string,
          )}/photos?per_page=20&order_by=popular`,
          {
            headers: {
              Authorization: `Client-ID ${ACCESS_KEY}`,
              "Accept-Version": "v1",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load photographer photos (${response.status}).`,
          );
        }

        const data: UnsplashPhoto[] = await response.json();

        if (!cancelled) {
          setUserPosts(data.filter((photo) => photo.id !== image?.id));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading photographer photos:", err);
          setUserPosts([]);
        }
      } finally {
        if (!cancelled) {
          setPostsLoading(false);
        }
      }
    }

    loadUserPosts();

    return () => {
      cancelled = true;
    };
  }, [image?.id, image?.user.username]);

  const saveImage = async () => {
    if (!image || saving) return;

    try {
      setSaving(true);
      showMessage("Saving image...");

      if (!ACCESS_KEY) {
        throw new Error("Unsplash API key is missing.");
      }

      // Unsplash requires this endpoint to be triggered when a user downloads.
      const trackResponse = await fetch(
        `https://api.unsplash.com/photos/${image.id}/download`,
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
        `photomart-${image.id}-${Date.now()}.jpg`,
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

      await createAssetAsync(downloadedFile.uri);
      showMessage("Image saved successfully");
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
    if (!image || sharing) return;

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
        `photomart-share-${image.id}-${Date.now()}.jpg`,
      );
      const downloadedFile = await File.downloadFileAsync(
        image.urls.full,
        destination,
      );

      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Share Image",
        UTI: "public.jpeg",
      });
    } catch (err) {
      console.error("Image sharing failed:", err);
      showMessage("Error while sharing the image.");
    } finally {
      setSharing(false);
    }
  };

  const setWallpaper = async () => {
    if (!image || settingWallpaper) return;

    try {
      setSettingWallpaper(true);
      await setWallpaperFromUrl({
        source: image.urls.full,
        target: "both",
      });
      showMessage("Wallpaper action completed.");
    } catch (err) {
      console.error("Setting wallpaper failed:", err);
      Alert.alert(
        "Wallpaper failed",
        err instanceof Error ? err.message : "Unable to set wallpaper.",
      );
    } finally {
      setSettingWallpaper(false);
      setOpenMenu(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading photo...</Text>
        </View>
      </Container>
    );
  }

  if (error || !image) {
    return (
      <Container>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Feather name="image" size={30} color="#6B7280" />
          </View>
          <Text style={styles.errorTitle}>Unable to load photo</Text>
          <Text style={styles.errorMessage}>
            {error || "Photo details are unavailable."}
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </Container>
    );
  }

  const visiblePosts = showAllPosts ? userPosts : userPosts.slice(0, 8);
  const photoWidth = Math.max(1, width - 32);
  const description =
    image.description ||
    image.alt_description ||
    "No description available for this photo.";

  return (
    <Container>
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color="#111827" />
          </Pressable>

          <Text style={styles.headerTitle}>Photo Details</Text>

          <Pressable
            onPress={() => setOpenMenu((current) => !current)}
            style={styles.menuButton}
            accessibilityLabel="Open photo actions"
          >
            <Feather name="more-vertical" size={22} color="#111827" />
          </Pressable>
        </View>

        {openMenu && (
          <View style={styles.menuOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setOpenMenu(false)}
            />

            <View style={styles.menu}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setOpenMenu(false);
                  saveImage();
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Feather name="download" size={19} color="#111827" />
                )}
                <Text style={styles.menuText}>
                  {saving ? "Downloading..." : "Download Image"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={setWallpaper}
                disabled={settingWallpaper}
              >
                {settingWallpaper ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <MaterialIcons name="wallpaper" size={20} color="#111827" />
                )}
                <Text style={styles.menuText}>
                  {settingWallpaper
                    ? "Setting wallpaper..."
                    : "Set as wallpaper"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setOpenMenu(false);
                  shareImage();
                }}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Feather name="share" size={19} color="#111827" />
                )}
                <Text style={styles.menuText}>
                  {sharing ? "Preparing..." : "Share Image"}
                </Text>
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setOpenMenu(false);
                  Alert.alert(
                    "Help & Feedback",
                    "For help, please use the support contact provided by this app.",
                  );
                }}
              >
                <Feather name="help-circle" size={19} color="#111827" />
                <Text style={styles.menuText}>Help & Feedback</Text>
              </Pressable>
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: image.urls.full }}
              style={[
                styles.photo,
                {
                  width: photoWidth,
                  aspectRatio:
                    image.width > 0 && image.height > 0
                      ? image.width / image.height
                      : 1,
                  backgroundColor: image.color || "#E5E7EB",
                },
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.content}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.likesIcon]}>
                  <Feather name="heart" size={19} color="#E11D48" />
                </View>
                <Text style={styles.statValue}>
                  {Number(image.likes ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.viewsIcon]}>
                  <Feather name="eye" size={19} color="#2563EB" />
                </View>
                <Text style={styles.statValue}>
                  {Number(image.views ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.downloadsIcon]}>
                  <Feather name="download" size={19} color="#059669" />
                </View>
                <Text style={styles.statValue}>
                  {Number(image.downloads ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Downloads</Text>
              </View>
            </View>

            <Pressable
              style={styles.photographerCard}
              onPress={() => {
                router.push({
                  pathname: "/user/[username]",
                  params: {
                    username: image.user.username,
                  },
                });
              }}
            >
              <Image
                source={{ uri: image.user.profile_image.medium }}
                style={styles.avatar}
              />
              <View style={styles.photographerInfo}>
                <Text style={styles.photographerName}>{image.user.name}</Text>
                <Text style={styles.username}>@{image.user.username}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>

            <Pressable onPress={() => setShowMore((current) => !current)}>
              <Text
                style={styles.description}
                numberOfLines={showMore ? undefined : 2}
              >
                {description}
              </Text>
              {(description.length > 100 || showMore) && (
                <Text style={styles.readMore}>
                  {showMore ? "Show less" : "Read more"}
                </Text>
              )}
            </Pressable>

            {image.tags?.length > 0 && (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={image.tags}
                keyExtractor={(item, index) => `${item.title}-${index}`}
                contentContainerStyle={styles.tagsList}
                renderItem={({ item }) => (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>#{item.title}</Text>
                  </View>
                )}
              />
            )}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  More from this photographer
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Discover more photos by @{image.user.username}
                </Text>
              </View>

              {userPosts.length > 8 && (
                <Pressable
                  style={styles.viewAllButton}
                  onPress={() => setShowAllPosts((current) => !current)}
                >
                  <Text style={styles.viewAllText}>
                    {showAllPosts ? "Show less" : "View all"}
                  </Text>
                  <Feather
                    name={showAllPosts ? "arrow-up" : "arrow-right"}
                    size={14}
                    color="#111827"
                  />
                </Pressable>
              )}
            </View>

            {postsLoading ? (
              <View style={styles.postsLoading}>
                <ActivityIndicator size="small" color="#111827" />
                <Text style={styles.postsLoadingText}>Loading photos...</Text>
              </View>
            ) : userPosts.length > 0 ? (
              <FlatList
                horizontal
                data={visiblePosts}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.postsList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.postCard}
                    onPress={() => {
                      router.push({
                        pathname: "/detail/[id]",
                        params: { id: item.id },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: item.urls.small || item.urls.regular }}
                      style={[
                        styles.postImage,
                        { backgroundColor: item.color || "#E5E7EB" },
                      ]}
                      resizeMode="cover"
                    />
                    <Text numberOfLines={2} style={styles.postCaption}>
                      {item.description ||
                        item.alt_description ||
                        "Photo by " + item.user.name}
                    </Text>
                  </Pressable>
                )}
              />
            ) : (
              <View style={styles.emptyPosts}>
                <Feather name="image" size={22} color="#9CA3AF" />
                <Text style={styles.emptyPostsText}>
                  No other photos available right now.
                </Text>
              </View>
            )}

            <View style={styles.unsplashAttribution}>
              <Text style={styles.attributionText}>
                Photo by {image.user.name} on Unsplash
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
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
  menuButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  menu: {
    position: "absolute",
    top: 62,
    right: 16,
    minWidth: 220,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  menuItem: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  menuText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 5,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  photoContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  photo: {
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  likesIcon: {
    backgroundColor: "#FFF1F2",
  },
  viewsIcon: {
    backgroundColor: "#EFF6FF",
  },
  downloadsIcon: {
    backgroundColor: "#ECFDF5",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 3,
  },
  photographerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingVertical: 8,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
  },
  photographerInfo: {
    flex: 1,
  },
  photographerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  username: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: "#111827",
  },
  readMore: {
    color: "#4F46E5",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  tagsList: {
    paddingVertical: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    color: "#374151",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 9,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  postsList: {
    gap: 12,
    paddingBottom: 8,
  },
  postCard: {
    width: 148,
  },
  postImage: {
    width: 148,
    height: 178,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  postCaption: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    color: "#374151",
  },
  postsLoading: {
    minHeight: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  postsLoadingText: {
    color: "#6B7280",
    fontSize: 13,
  },
  emptyPosts: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyPostsText: {
    fontSize: 13,
    color: "#6B7280",
  },
  unsplashAttribution: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 24,
    paddingTop: 14,
  },
  attributionText: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
  },
});
