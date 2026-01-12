import React, {useEffect, useState} from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import type { Region } from "react-native-maps";
import { MapView, Marker, PROVIDER_GOOGLE, isAvailable as mapAvailable } from "../components/MapKit";
import * as Location from "expo-location";
import { darkMapStyle } from "../components/mapStyle";

const FALLBACK_REGION: Region = {
    latitude: 47.3769,
    longitude: 8.5417,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

type SearchResult = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
};

const MapsScreen: React.FC = () => {
    const [query, setQuery] = useState("");
    const [region, setRegion] = useState<Region>(FALLBACK_REGION);
    const [selected, setSelected] = useState<SearchResult | null>(null);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    return;
                }
                const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                if (!active) return;
                setRegion({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            } catch {
                // keep fallback
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const handleSearch = async () => {
        const trimmed = query.trim();
        if (!trimmed) {
            setError("Enter a location to search");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                trimmed,
            )}&limit=8`;
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "carva-app/1.0",
                },
            });
            if (!response.ok) {
                throw new Error("Search failed");
            }
            const data = await response.json();
            const mapped: SearchResult[] = data.map((item: any, idx: number) => ({
                id: item.place_id?.toString() ?? `result-${idx}`,
                name: item.display_name ?? trimmed,
                latitude: Number(item.lat),
                longitude: Number(item.lon),
            }));
            setResults(mapped);
            if (mapped.length > 0) {
                const first = mapped[0];
                setSelected(first);
                setRegion({
                    latitude: first.latitude,
                    longitude: first.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            }
            if (mapped.length === 0) {
                setError("No results found");
            }
        } catch (e) {
            setError("Could not search right now");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: SearchResult) => {
        setSelected(item);
        setRegion({
            latitude: item.latitude,
            longitude: item.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        });
    };

    const canRenderMap = mapAvailable();

    return (
        <View style={styles.container}>
            {canRenderMap ? (
                <MapView
                    style={StyleSheet.absoluteFillObject}
                    provider={PROVIDER_GOOGLE}
                    region={region}
                    showsUserLocation
                    customMapStyle={darkMapStyle}
                >
                    {selected && (
                        <Marker
                            coordinate={{ latitude: selected.latitude, longitude: selected.longitude }}
                            pinColor="#FF6A00"
                            title={selected.name}
                        />
                    )}
                </MapView>
            ) : (
                <View style={styles.mapFallback}>
                    <Text style={styles.mapFallbackTitle}>Map unavailable</Text>
                    <Text style={styles.mapFallbackText}>
                        This runtime doesn’t include react-native-maps. Use a dev build
                        (expo-dev-client) or switch to expo-maps, or open in a build
                        with the native module installed.
                    </Text>
                </View>
            )}

            <View style={styles.overlay}>
                <View style={styles.searchRow}>
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search for a city or place"
                        placeholderTextColor="#888"
                        style={styles.input}
                        keyboardAppearance="dark"
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.searchButtonText}>Go</Text>}
                    </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {results.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.resultsContent}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)}>
                                    <View style={styles.resultDot} />
                                    <Text style={styles.resultText} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </View>
        </View>
    );
};

export default MapsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101010",
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 14,
        paddingHorizontal: 14,
        gap: 8,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: "#1b1b1b",
        color: "#fff",
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#242424",
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: "#FF6A00",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    searchButtonText: {
        color: "#000",
        fontWeight: "700",
    },
    errorText: {
        color: "#ff8a80",
    },
    resultsContainer: {
        maxHeight: 260,
        backgroundColor: "rgba(16,16,16,0.92)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#242424",
        overflow: "hidden",
    },
    resultsContent: {
        padding: 12,
        gap: 10,
    },
    resultRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        backgroundColor: "#1b1b1b",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#242424",
    },
    resultDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FF6A00",
    },
    resultText: {
        color: "#fff",
        flex: 1,
        fontSize: 14,
    },
    emptyText: {
        color: "#888",
        textAlign: "center",
        marginVertical: 8,
    },
    mapFallback: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#0f0f0f",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    mapFallbackTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        textAlign: "center",
    },
    mapFallbackText: {
        color: "#9fa0a5",
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
    },
});

// map style moved to components/mapStyle.ts for reuse
