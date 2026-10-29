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
  const [collectionData, setCollectionData] = useState<
    category[] | undefined
  >();
  const [search, setSearch] = useState<string>();
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
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size={"large"} color={"#000"} />
        <Text>Loading...</Text>
      </View>
    );
  }
  return (
    <Container>
      <View className="p-2 flex-1">
        {/* title */}
        <View className="mb-3">
          <Text className="text-2xl font-bold">Category</Text>
        </View>
        {/* title */}

        {/* search bar */}
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center border border-gray-200 flex-1 px-2 rounded-[10px]">
            <Feather name="search" size={20} />
            <TextInput
              placeholder="Search category..."
              placeholderTextColor={"#000"}
              onChangeText={(e) => setSearch(e)}
              className="text-black"
              onSubmitEditing={() => loadCategory(search)}
            />
          </View>
          <Pressable className="flex flex-row gap-2 items-center bg-black px-3 py-3 rounded-[10px]">
            <Feather name="search" size={20} color={"white"} />
            <Text className="text-white font-bold">Search</Text>
          </Pressable>
        </View>
        {/* search bar */}

        {/* category */}
        <View className=" mt-3">
          <FlatList
            data={collectionData}
            key={"something-great"}
            keyExtractor={(item) => item.id}
            numColumns={2}
            style={{ gap: 2 }}
            contentContainerStyle={{ padding: 2, gap: 2 }}
            renderItem={({ item, index }) => (
              <View className="w-[200px] m-2" key={index}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(collections)/[topic]",
                      params: { topic: item.id, topicName: item.title },
                    })
                  }
                >
                  <View>
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
                      <Text className="text-2xl text-white font-bold">
                        {item.total_photos}+
                      </Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} className="capitalize font-bold">
                    {item.title}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </View>
        {/* category */}
      </View>
      <View className="mb-[100px]" />
    </Container>
  );
}
