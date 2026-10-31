import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Container from "../../../components/layout/container";
import { useTheme } from "../../../hooks/useTheme";

type UserProfile = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  location: string | null;
  portfolio_url: string | null;
  total_likes: number;
  total_photos: number;
  total_collections: number;
  profile_image: {
    small: string;
    medium: string;
    large: string;
  };
  links: {
    html: string;
    photos: string;
    followers: string;
    following: string;
  };
};

type UserPhoto = {
  id: string;
  width: number;
  height: number;
  color: string | null;
  description: string | null;
  alt_description: string | null;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  likes: number;
  user: {
    name: string;
    username: string;
  };
};

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const API_BASE_URL = "https://api.unsplash.com";

export default function UserScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { username } = useLocalSearchParams<{ username: string }>();

  const normalizedUsername = Array.isArray(username)
    ? username[0]
    : username;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"popular" | "latest">("popular");

  const fetchUserData = useCallback(
    async (refresh = false) => {
      if (!normalizedUsername) {
        setError("Photographer username is missing.");
        setProfileLoading(false);
        setPhotosLoading(false);
        return;
      }

      if (!ACCESS_KEY) {
        setError("Unsplash API key is missing. Check your .env file.");
        setProfileLoading(false);
        setPhotosLoading(false);
        return;
      }

      try {
        setError(null);

        if (refresh) {
          setRefreshing(true);
        } else {
          setProfileLoading(true);
          setPhotosLoading(true);
        }

        const headers = {
          Authorization: `Client-ID ${ACCESS_KEY}`,
          "Accept-Version": "v1",
        };

        const encodedUsername = encodeURIComponent(normalizedUsername);

        const [profileResponse, photosResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/users/${encodedUsername}`, { headers }),
          fetch(
            `${API_BASE_URL}/users/${encodedUsername}/photos?per_page=30&order_by=${activeTab}`,
            { headers }
          ),
        ]);

        if (!profileResponse.ok) {
          throw new Error(
            profileResponse.status === 404
              ? "Photographer not found."
              : `Unable to load profile (${profileResponse.status}).`
          );
        }

        if (!photosResponse.ok) {
          throw new Error(`Unable to load photos (${photosResponse.status}).`);
        }

        const [profileData, photoData] = await Promise.all([
          profileResponse.json() as Promise<UserProfile>,
          photosResponse.json() as Promise<UserPhoto[]>,
        ]);

        setProfile(profileData);
        setPhotos(photoData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setProfileLoading(false);
        setPhotosLoading(false);
        setRefreshing(false);
      }
    },
    [normalizedUsername, activeTab]
  );

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const openPhoto = (photoId: string) => {
    router.push({
      pathname: "/photo/[id]",
      params: { id: photoId },
    } as never);
  };

  // Split photos into two columns to create a Pinterest-style masonry layout.
  const leftPhotos = photos.filter((_, index) => index % 2 === 0);
  const rightPhotos = photos.filter((_, index) => index % 2 !== 0);

  if (profileLoading && !profile) {
    return (
      <Container>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.text} />
          <Text style={styles.mutedText}>Loading photographer...</Text>
        </View>
      </Container>
    );
  }

  if (error && !profile) {
    return (
      <Container>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Feather name="user" size={28} color={theme.textMuted} />
          </View>

          <Text style={styles.errorTitle}>Unable to load profile</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => fetchUserData()}
          >
            <Feather name="refresh-cw" size={16} color={theme.onPrimary} />
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUserData(true)}
              tintColor={theme.text}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.headerButton}
              accessibilityLabel="Go back"
            >
              <Feather name="arrow-left" size={21} color={theme.text} />
            </Pressable>

            <Text style={styles.headerTitle}>Photographer</Text>

            <Pressable
              onPress={() => {
                if (profile?.links.html) {
                  Alert.alert("Unsplash profile", profile.links.html);
                }
              }}
              style={styles.headerButton}
              accessibilityLabel="Profile options"
            >
              <Feather name="external-link" size={19} color={theme.text} />
            </Pressable>
          </View>

          {/* Photographer profile */}
          {profile && (
            <View style={styles.profileSection}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: profile.profile_image.large }}
                  style={styles.avatar}
                />
              </View>

              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.username}>@{profile.username}</Text>

              {!!profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}

              {!!profile.location && (
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={14} color={theme.textMuted} />
                  <Text style={styles.metaText}>{profile.location}</Text>
                </View>
              )}

              {!!profile.portfolio_url && (
                <View style={styles.metaRow}>
                  <Feather name="link" size={14} color={theme.textMuted} />
                  <Text numberOfLines={1} style={styles.metaText}>
                    {profile.portfolio_url}
                  </Text>
                </View>
              )}

              {/* Statistics */}
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Number(profile.total_photos ?? 0).toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Photos</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Number(profile.total_likes ?? 0).toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Number(profile.total_collections ?? 0).toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Collections</Text>
                </View>
              </View>
            </View>
          )}

          {/* Photos section */}
          <View style={styles.photosSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Photos</Text>
                <Text style={styles.sectionSubtitle}>
                  Discover this photographer&apos;s work
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>{photos.length}</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(["popular", "latest"] as const).map((tab) => {
                const selected = activeTab === tab;

                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tab, selected && styles.activeTab]}
                  >
                    <Feather
                      name={tab === "popular" ? "trending-up" : "clock"}
                      size={14}
                      color={selected ? theme.onPrimary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        selected && styles.activeTabText,
                      ]}
                    >
                      {tab === "popular" ? "Popular" : "Latest"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Loading state */}
            {photosLoading ? (
              <View style={styles.loadingPhotos}>
                <ActivityIndicator size="large" color={theme.text} />
                <Text style={styles.mutedText}>Loading photos...</Text>
              </View>
            ) : photos.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="image" size={28} color={theme.textMuted} />
                <Text style={styles.emptyTitle}>No photos found</Text>
                <Text style={styles.emptyText}>
                  This photographer has no photos to show right now.
                </Text>

                {error && (
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => fetchUserData()}
                  >
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              // Pinterest-style masonry columns
              <View style={styles.masonryGrid}>
                {[leftPhotos, rightPhotos].map((columnPhotos, columnIndex) => (
                  <View key={columnIndex} style={styles.masonryColumn}>
                    {columnPhotos.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.photoCard}
                        onPress={() => openPhoto(item.id)}
                      >
                        <Image
                          source={{
                            uri: item.urls.small || item.urls.regular,
                          }}
                          style={[
                            styles.photoImage,
                            {
                              aspectRatio:
                                item.width > 0 && item.height > 0
                                  ? item.width / item.height
                                  : 0.8,
                              backgroundColor:
                                item.color || theme.imagePlaceholder,
                            },
                          ]}
                          resizeMode="cover"
                        />

                        <View style={styles.photoInfo}>
                          <Text
                            numberOfLines={1}
                            style={styles.photoCaption}
                          >
                            {item.description ||
                              item.alt_description ||
                              "Untitled photo"}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {!!error && photos.length > 0 && (
              <Pressable
                style={styles.errorBanner}
                onPress={() => fetchUserData()}
              >
                <Feather
                  name="alert-circle"
                  size={15}
                  color={theme.error}
                />
                <Text style={styles.errorBannerText}>
                  {error} Tap to retry.
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.attribution}>
            <Text style={styles.attributionText}>
              Photographer profile and photos provided by Unsplash.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Container>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
    padding: 24,
  },
  mutedText: {
    marginTop: 10,
    color: theme.textSecondary,
    fontSize: 13,
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: theme.text,
    fontSize: 17,
    fontWeight: "700",
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 26,
  },
  avatarWrapper: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 14,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: theme.imagePlaceholder,
  },
  name: {
    fontSize: 23,
    fontWeight: "800",
    color: theme.text,
    textAlign: "center",
  },
  username: {
    marginTop: 5,
    fontSize: 13,
    color: theme.textSecondary,
  },
  bio: {
    marginTop: 14,
    maxWidth: 420,
    textAlign: "center",
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  metaRow: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: theme.textSecondary,
  },
  statsCard: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 17,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.text,
  },
  statLabel: {
    marginTop: 5,
    fontSize: 11,
    color: theme.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
  },
  photosSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 21,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: theme.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 12,
    color: theme.text,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.surfaceSecondary,
  },
  activeTab: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  activeTabText: {
    color: theme.onPrimary,
  },
  masonryGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingBottom: 12,
  },
  masonryColumn: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  photoCard: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 10,
  },
  photoImage: {
    width: "100%",
    borderRadius: 9,
  },
  photoInfo: {
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  photoCaption: {
    color: theme.text,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  photoLikes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  likesText: {
    color: theme.textSecondary,
    fontSize: 11,
  },
  loadingPhotos: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.border,
    borderRadius: 12,
  },
  emptyTitle: {
    marginTop: 12,
    color: theme.text,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 6,
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: theme.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: theme.onPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorMessage: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.primary,
  },
  primaryButtonText: {
    color: theme.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 14,
    padding: 10,
  },
  backButtonText: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: theme.errorBackground,
    borderRadius: 10,
  },
  errorBannerText: {
    flex: 1,
    color: theme.error,
    fontSize: 12,
  },
  attribution: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: "center",
  },
  attributionText: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: "center",
  },
  });
}
