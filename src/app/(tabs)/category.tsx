import {
  View,
  Text,
  TextInput,
  Pressable,
  ToastAndroid,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import Container from "../../../components/layout/container";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import HeaderComponent from "../../../components/layout/header";
import { useTheme } from "@/hooks/useTheme";

type category = {
  title: string;
  height?: number;
  width?: number;
  user?: {
    username: string;
    name: string;
    profile_image: {
      small: string;
    };
  };
  urls?: {
    regular?: string;
    full?: string;
  };
  color?: string;
  cover_photo?: {
    alt_description: string;
    asset_type: string;
    height: number;
    width: number;
    user?: {
      username: string;
      name: string;
      profile_image: {
        small: string;
      };
    };
    urls: {
      regular?: string;
      full?: string;
    };
    id: string;
    color: string;
  };
  id: string;
  total_photos?: number;
  description: string;
};

export default function category() {
  const theme = useTheme();
  const [collectionData, setCollectionData] = useState<
    category[] | undefined
  >();
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const loadCategory = async (category?: string) => {
    setLoading(true);
    const response = await fetch(
      category
        ? `${process.env.EXPO_PUBLIC_UNSPLASH_URL}/search/photos?&query=${encodeURI(category)}`
        : `${process.env.EXPO_PUBLIC_UNSPLASH_URL}/topics?per_page=50`,
      {
        method: "GET",
        headers: {
          Authorization: `Client-ID ${process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY}`,
          "Accept-Version": "v1",
        },
      },
    );
    if (!response.ok) {
      ToastAndroid.show(`API ERROR: ${response.status}`, ToastAndroid.SHORT);
      console.log("API ERROR, error loading category:", response.status);
      setLoading(false);
      return;
    }
    const data = await response.json();
    setCollectionData(category ? data.results : data);
    setLoading(false);
  };

  useEffect(() => {
    loadCategory();
  }, []);

  if (loading) {
    return (
      <Container>
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: theme.background }}
        >
          <ActivityIndicator size="large" color={theme.text} />
          <Text style={{ color: theme.text }}>Loading...</Text>
        </View>
      </Container>
    );
  }
  return (
    <Container>
      <HeaderComponent title={"Category"} />
      <View className="p-2 flex-1">
        {/* search bar */}
        {/* Search bar */}
        <View style={styles.searchRow}>
          <View
            style={[styles.searchInputContainer, { borderColor: theme.border }]}
          >
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              style={[{ color: theme.text }, styles.searchInput]}
              placeholderTextColor={theme.textSecondary}
              placeholder="Search images..."
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={true}
            />

            {searchText?.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchText("");
                }}
                hitSlop={8}
              >
                <Feather
                  name="x-circle"
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.searchButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="search" size={18} color={theme.textInverse} />
            <Text
              style={[styles.searchButtonText, { color: theme.textInverse }]}
            >
              Search
            </Text>
          </Pressable>
        </View>
        {/* search bar */}

        {/* category */}
        <View
          className="flex-1 h-full"
          style={{ backgroundColor: theme.background }}
        >
          <FlatList
            data={collectionData}
            key={"something-great"}
            keyExtractor={(item) => item.id}
            numColumns={2}
            style={{ flex: 1, gap: 2 }}
            contentContainerStyle={{
              gap: 2,
              justifyContent: "space-between",
              flexWrap: "wrap",
              alignItems: "center",
            }}
            renderItem={({ item, index }) => (
              <View className="w-[200px] mr-[10px] mb-[10px]" key={index}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(collections)/[topic]",
                      params: { topic: item.id, topicName: item.title },
                    })
                  }
                >
                  <View
                    style={{
                      backgroundColor: theme.surface,
                      borderRadius: 10,
                    }}
                  >
                    <Image
                      source={{ uri: item?.cover_photo?.urls.regular }}
                      style={{
                        aspectRatio: 9 / 6,
                        borderRadius: 10,
                      }}
                    />
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          backgroundColor: "rgba(0, 0, 0, 0.3)",
                          borderRadius: 10,
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Text
                        className="text-2xl font-bold"
                        style={{ color: "#FFFFFF" }}
                      >
                        {item.total_photos}+
                      </Text>
                    </View>
                  </View>
                  <Text
                    numberOfLines={1}
                    className="capitalize font-bold"
                    style={{ color: theme.text }}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </View>
        {/* category */}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
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
});
