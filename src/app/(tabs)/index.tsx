import { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
  TextInput,
  Keyboard,
} from "react-native";

import { fetchImages } from "../../../lib/fetch-images";
import Container from "../../../components/layout/container";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";

type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  alt_description: string | null;
  urls: {
    regular: string;
  };
  user: {
    profile_image: {
      medium: string;
    };
    username: string;
  };
};

type Chip = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const PAGE_SIZE = 20;

const chips: Chip[] = [
  { label: "nature", icon: "feather" },
  { label: "mountains", icon: "map" },
  { label: "ocean", icon: "droplet" },
  { label: "animals", icon: "github" },
  { label: "flowers", icon: "sun" },
  { label: "sunsets", icon: "sunset" },
  { label: "beaches", icon: "umbrella" },
  { label: "waterfalls", icon: "cloud-rain" },
  { label: "desert", icon: "sun" },
  { label: "cities", icon: "home" },
  { label: "architecture", icon: "columns" },
  { label: "buildings", icon: "grid" },
  { label: "streets", icon: "map-pin" },
  { label: "travel", icon: "compass" },
  { label: "adventure", icon: "navigation" },
  { label: "people", icon: "users" },
  { label: "portraits", icon: "user" },
  { label: "fashion", icon: "shopping-bag" },
  { label: "forests", icon: "map" },
  { label: "food", icon: "coffee" },
  { label: "coffee", icon: "coffee" },
  { label: "technology", icon: "monitor" },
  { label: "computers", icon: "monitor" },
  { label: "cars", icon: "truck" },
  { label: "sports", icon: "activity" },
  { label: "fitness", icon: "heart" },
  { label: "music", icon: "music" },
  { label: "art", icon: "edit-3" },
  { label: "minimal", icon: "minus-circle" },
  { label: "abstract", icon: "layers" },
];

export default function Index() {
  const [images, setImages] = useState<UnsplashPhoto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeChip, setActiveChip] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const isFetchingMore = useRef(false);
  const requestId = useRef(0);
  const currentQuery = useRef<string | undefined>(undefined);

  const loadImages = useCallback(
    async (query: string | undefined, page: number, append = false) => {
      if (append && (isFetchingMore.current || !hasMoreRef.current)) {
        return;
      }

      // A new search invalidates any older request.
      const request = append ? requestId.current : ++requestId.current;

      if (append) {
        isFetchingMore.current = true;
        setLoadingMore(true);
      } else {
        isFetchingMore.current = false;
        setLoading(true);
        setLoadingMore(false);
        setImages([]);
        pageRef.current = 1;
        hasMoreRef.current = true;
        setHasMore(true);
      }

      setError(null);

      try {
        const data = await fetchImages({
          query: query || undefined,
          page: String(page),
        });

        // Ignore responses belonging to an older search.
        if (request !== requestId.current) {
          return;
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid API response");
        }

        const newImages: UnsplashPhoto[] = data;

        setImages((previousImages) => {
          if (!append) {
            return newImages;
          }

          const existingIds = new Set(previousImages.map((image) => image.id));

          return [
            ...previousImages,
            ...newImages.filter((image) => !existingIds.has(image.id)),
          ];
        });

        pageRef.current = page;

        const moreAvailable = newImages.length === PAGE_SIZE;
        hasMoreRef.current = moreAvailable;
        setHasMore(moreAvailable);
      } catch (err) {
        if (request === requestId.current) {
          console.error("Failed to load images:", err);
          setError("Unable to load images. Please try again.");
        }
      } finally {
        if (request === requestId.current) {
          isFetchingMore.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadImages(undefined, 1);
  }, [loadImages]);

  const performSearch = (value: string) => {
    const query = value.trim() || undefined;

    Keyboard.dismiss();
    currentQuery.current = query;
    setActiveChip(undefined);

    loadImages(query, 1);
  };

  const selectChip = (label: string) => {
    currentQuery.current = label;
    setSearchText(label);
    setActiveChip(label);

    Keyboard.dismiss();
    loadImages(label, 1);
  };

  const loadNextPage = () => {
    if (loading || loadingMore || isFetchingMore.current) {
      return;
    }

    if (!hasMoreRef.current) {
      return;
    }

    loadImages(currentQuery.current, pageRef.current + 1, true);
  };

  const retry = () => {
    if (images.length === 0) {
      loadImages(currentQuery.current, 1);
    } else {
      loadImages(currentQuery.current, pageRef.current + 1, true);
    }
  };

  const leftImages = images.filter((_, index) => index % 2 === 0);
  const rightImages = images.filter((_, index) => index % 2 !== 0);

  const renderPhoto = (item: UnsplashPhoto) => (
    <View key={item.id} style={styles.imageCard}>
      <View style={styles.userRow}>
        <View className="flex-row items-center gap-2">
          <Image
            source={{ uri: item.user.profile_image.medium }}
            style={styles.avatar}
          />
          <Pressable onPress={()=>router.push({
            pathname:"/user/[username]",
            params:{
              username:item.user.username
            }
          })}>
            <Text
              style={styles.username}
              numberOfLines={1}
              className="font-bold"
            >
              {item.user.username}
            </Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/detail/[id]",
            params: {
              id: item.id,
            },
          })
        }
      >
        <Image
          source={{ uri: item.urls.regular }}
          style={[
            styles.image,
            {
              aspectRatio:
                item.width > 0 && item.height > 0
                  ? item.width / item.height
                  : 1,
            },
          ]}
          resizeMode="cover"
        />

        <Text style={styles.caption} numberOfLines={2}>
          {item.alt_description || "Unsplash image"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Container>
      <View style={styles.container}>
        <Text className="text-2xl font-bold mb-3">PhotoMart</Text>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Feather name="search" size={20} color="#777" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              className="text-black"
              placeholderTextColor={"#000"}
              onSubmitEditing={() => performSearch(searchText)}
              placeholder="Search images..."
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />

            {searchText.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchText("");
                  performSearch("");
                }}
                hitSlop={8}
              >
                <Feather name="x-circle" size={18} color="#777" />
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.searchButton}
            onPress={() => performSearch(searchText)}
          >
            <Feather name="search" size={18} color="#fff" />
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>

        {/* Filter chips */}
        <View>
          <FlatList
            horizontal
            data={chips}
            keyExtractor={(item) => item.label}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.chipsList}
            contentContainerStyle={styles.chipsContent}
            renderItem={({ item }) => {
              const selected = item.label === activeChip;

              return (
                <Pressable
                  style={[styles.chip, selected && styles.activeChip]}
                  onPress={() => selectChip(item.label)}
                >
                  <Feather
                    name={item.icon}
                    size={16}
                    color={selected ? "#fff" : "#333"}
                  />

                  <Text
                    style={[styles.chipText, selected && styles.activeChipText]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {error && images.length > 0 && (
          <Pressable onPress={retry} style={styles.errorBanner}>
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </Pressable>
        )}

        {loading && (
          <View className="flex-1 justify-center items-center flex-col">
            {" "}
            <ActivityIndicator
              size={"large"}
              style={{ width: 500, height: 500 }}
            />
            <Text>Loading Images...</Text>
          </View>
        )}
        {!loading && (
          <FlatList
            data={[{ id: "masonry-grid" }]}
            keyExtractor={(item) => item.id}
            renderItem={() => (
              <View style={styles.masonry}>
                <View style={styles.column}>{leftImages.map(renderPhoto)}</View>
                <View style={styles.column}>
                  {rightImages.map(renderPhoto)}
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onEndReached={loadNextPage}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
            // @ts-ignore
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.emptyText}>
                  {error || "No images found. Try another search."}
                </Text>
              ) : null
            }
            ListFooterComponent={
              <View style={styles.footer}>
                {loadingMore && <ActivityIndicator size="large" />}

                {!hasMore && images.length > 0 && (
                  <Text style={styles.statusText}>No more images.</Text>
                )}
              </View>
            }
          />
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  searchInputContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 44,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    color: "#111",
  },

  searchButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: "#000",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  chipsList: {
    flexGrow: 0,
    marginBottom: 8,
  },

  chipsContent: {
    gap: 8,
    paddingBottom: 6,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  activeChip: {
    backgroundColor: "#000",
    borderColor: "#000",
  },

  chipText: {
    color: "#333",
    fontSize: 13,
  },

  activeChipText: {
    color: "#fff",
  },

  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },

  errorBanner: {
    padding: 10,
  },

  masonry: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  column: {
    flex: 1,
    minWidth: 0,
  },

  imageCard: {
    marginBottom: 12,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e5e5e5",
  },

  username: {
    flex: 1,
    fontSize: 12,
    color: "#333",
  },

  image: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#e5e5e5",
  },

  caption: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: "#333",
  },

  list: {
    paddingBottom: 24,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 15,
    color: "#666",
  },

  footer: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 12,
  },

  statusText: {
    fontSize: 14,
    color: "#666",
  },

  errorText: {
    color: "#d32f2f",
    textAlign: "center",
  },
});
