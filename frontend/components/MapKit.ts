// components/MapKit.ts
// Unified adapter to use expo-maps in Expo Go (preferred) and fallback to react-native-maps

/* eslint-disable @typescript-eslint/no-explicit-any */
let ExpoMaps: any = null;
let RNMaps: any = null;

try {
  // Try expo-maps first (works in Expo Go if the JS package is installed)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoMaps = require("expo-maps");
} catch (e) {
  ExpoMaps = null;
}

if (!ExpoMaps) {
  try {
    // Fallback to react-native-maps (requires dev client or production build)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    RNMaps = require("react-native-maps");
  } catch (e) {
    RNMaps = null;
  }
}

export const provider: "expo" | "rn" | null = ExpoMaps ? "expo" : RNMaps ? "rn" : null;

export const MapView: any = provider === "expo" ? ExpoMaps.MapView : provider === "rn" ? RNMaps?.default : null;
export const Marker: any = provider === "expo" ? ExpoMaps.Marker : provider === "rn" ? RNMaps?.Marker : null;
export const Polyline: any = provider === "expo" ? ExpoMaps.Polyline : provider === "rn" ? RNMaps?.Polyline : null;
export const PROVIDER_GOOGLE: any = provider === "rn" ? RNMaps?.PROVIDER_GOOGLE : undefined;

export const isAvailable = () => Boolean(MapView);
