import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Appearance } from "react-native";
import type { SettingsType } from "../types/Settings";

const SETTINGS_STORAGE_KEY = "@photomart/settings";

const DEFAULT_SETTINGS: SettingsType = {
  theme: "system",
  grid_layout: "masonry",
  auto_download: false,
  notifications: true,
};

type SettingsContextValue = {
  settings: SettingsType;
  settingsLoaded: boolean;
  updateSettings: (updates: Partial<SettingsType>) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function isSettings(value: unknown): value is Partial<SettingsType> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!stored) return;

        const parsed: unknown = JSON.parse(stored);
        if (!isSettings(parsed)) {
          throw new Error("Stored PhotoMart settings have an invalid format.");
        }

        const nextSettings: SettingsType = {
          ...DEFAULT_SETTINGS,
          ...(parsed.theme === "system" ||
          parsed.theme === "light" ||
          parsed.theme === "dark"
            ? { theme: parsed.theme }
            : {}),
          ...(parsed.grid_layout === "masonry" || parsed.grid_layout === "grid"
            ? { grid_layout: parsed.grid_layout }
            : {}),
          ...(typeof parsed.auto_download === "boolean"
            ? { auto_download: parsed.auto_download }
            : {}),
          ...(typeof parsed.notifications === "boolean"
            ? { notifications: parsed.notifications }
            : {}),
        };

        if (active) {
          settingsRef.current = nextSettings;
          setSettings(nextSettings);
        }
      } catch (error) {
        console.error("Failed to load PhotoMart settings:", error);
        Alert.alert(
          "Settings unavailable",
          "Saved settings could not be loaded. Default settings will be used.",
        );
      } finally {
        if (active) setSettingsLoaded(true);
      }
    };

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(
      settings.theme === "system" ? "unspecified" : settings.theme,
    );
  }, [settings.theme]);

  const updateSettings = useCallback(async (updates: Partial<SettingsType>) => {
    const write = writeQueueRef.current.then(async () => {
      const nextSettings = { ...settingsRef.current, ...updates };
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(nextSettings),
      );
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
    });
    writeQueueRef.current = write.catch(() => undefined);

    try {
      await write;
    } catch (error) {
      console.error("Failed to save PhotoMart settings:", error);
      Alert.alert(
        "Could not save settings",
        "Please check your device storage and try again.",
      );
    }
  }, []);

  const value = useMemo(
    () => ({ settings, settingsLoaded, updateSettings }),
    [settings, settingsLoaded, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider.");
  }
  return context;
}
