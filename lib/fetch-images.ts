import { ToastAndroid } from "react-native";

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

type FetchImagesOptions = {
  query?: string;
  page?: string;
};
export const fetchImages = async ({
  query,
  page = "1",
}: FetchImagesOptions) => {
  const url = new URL(
    query
      ? "https://api.unsplash.com/search/photos"
      : "https://api.unsplash.com/photos",
  );

  url.searchParams.set("page", page);
  url.searchParams.set("per_page", "20");

  if (query) {
    url.searchParams.set("query", query);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Client-ID ${ACCESS_KEY}`,
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    ToastAndroid.show(`API ERROR: ${response.status}`, ToastAndroid.SHORT);
    console.log("API ERROR, error loading category:", response.status);
  }
  const data = await response.json();

  return query ? data.results : data;
};
