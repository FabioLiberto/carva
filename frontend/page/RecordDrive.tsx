import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import useDriveRecorder from "../hooks/useDriveRecorder";

type Props = {
    onFinished?: () => void;
    onSaved?: () => void;
};

const FALLBACK_REGION: Region = {
    latitude: 47.3769,
    longitude: 8.5417,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

type UploadPayload = {
    startedAt: string;
    endedAt: string;
    distanceKm: number;
    avgSpeedKmh: number;
    points: Array<{
        lat: number;
        lng: number;
        timestamp: string;
    }>;
};

async function uploadActivity(payload: UploadPayload) {
    // Placeholder for future backend call.
    console.log("Uploading activity", payload);
    await new Promise((resolve) => setTimeout(resolve, 500));
}

const RecordDriveScreen: React.FC<Props> = ({ onFinished, onSaved }) => {
    const [baseRegion, setBaseRegion] = useState<Region>(FALLBACK_REGION);
    const {
        state,
        points,
        start,
        stop,
        reset,
        error,
        distanceMeters,
        durationSeconds,
        avgSpeedKmh,
        startedAt,
        endedAt,
    } = useDriveRecorder();

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;

                const position = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                if (!active) return;

                const { latitude, longitude } = position.coords;
                setBaseRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            } catch {
                // keep fallback region
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const latestPoint = points[points.length - 1];
    const region = useMemo<Region>(() => {
        if (!latestPoint) return baseRegion;
        return {
            latitude: latestPoint.latitude,
            longitude: latestPoint.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    }, [latestPoint, baseRegion]);

    const distanceKm = distanceMeters / 1000;

    const formattedDuration = useMemo(() => {
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const seconds = durationSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
        }

        return `${minutes}:${seconds.toString().padStart(2, "0")} min`;
    }, [durationSeconds]);

    const handleStart = async () => {
        try {
            await start();
        } catch (e) {
            Alert.alert("Error", "Unable to start recording. Please try again.");
        }
    };

    const handleStop = async () => {
        try {
            await stop();
        } catch (e) {
            Alert.alert("Error", "Unable to stop recording. Please try again.");
        }
    };

    const handleCancel = () => {
        reset();
        onFinished?.();
    };

    const handleSave = async () => {
        if (!startedAt || points.length < 2) {
            reset();
            onFinished?.();
            return;
        }

        const payload: UploadPayload = {
            startedAt: new Date(startedAt).toISOString(),
            endedAt: new Date(endedAt ?? Date.now()).toISOString(),
            distanceKm: Number(distanceKm.toFixed(3)),
            avgSpeedKmh: Number(avgSpeedKmh.toFixed(2)),
            points: points.map((p) => ({
                lat: p.latitude,
                lng: p.longitude,
                timestamp: new Date(p.timestamp).toISOString(),
            })),
        };

        try {
            await uploadActivity(payload);
            reset();
            onSaved?.();
            onFinished?.();
        } catch (e) {
            Alert.alert("Upload failed", "Please try saving again.");
        }
    };

    const renderButtons = () => {
        if (state === "recording") {
            return (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dangerButton} onPress={handleStop}>
                        <Text style={styles.primaryButtonText}>Stop</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (state === "finished") {
            return (
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
                        <Text style={styles.secondaryButtonText}>Discard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
                        <Text style={styles.primaryButtonText}>Save & upload</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
                <Text style={styles.primaryButtonText}>
                    {points.length > 0 ? "Start new drive" : "Start drive"}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={region}
                customMapStyle={darkMapStyle}
                showsUserLocation
            >
                {points.length > 1 && (
                    <Polyline
                        coordinates={points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
                        strokeWidth={5}
                        strokeColor="#FF6A00"
                    />
                )}
            </MapView>

            <View style={styles.overlay}>
                {error && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {state === "recording" && !latestPoint && (
                    <View style={styles.searchingRow}>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.searchingText}>Searching for GPS...</Text>
                    </View>
                )}

                <View style={styles.statsRow}>
                    <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Distance</Text>
                        <Text style={styles.statValue}>{distanceKm.toFixed(2)} km</Text>
                    </View>
                    <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Duration</Text>
                        <Text style={styles.statValue}>{formattedDuration}</Text>
                    </View>
                    <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Avg speed</Text>
                        <Text style={styles.statValue}>{avgSpeedKmh.toFixed(1)} km/h</Text>
                    </View>
                </View>

                {renderButtons()}
            </View>
        </View>
    );
};

const darkMapStyle = [
    {
        elementType: "geometry",
        stylers: [{ color: "#1d1d1d" }],
    },
    {
        elementType: "labels.text.fill",
        stylers: [{ color: "#8a8a8a" }],
    },
    {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1d1d1d" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#2c2c2c" }],
    },
];

export default RecordDriveScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    map: {
        flex: 1,
    },
    overlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
        paddingBottom: 24,
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    errorBanner: {
        backgroundColor: "#3b1f1f",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    errorText: {
        color: "#ff8a80",
        fontSize: 13,
        textAlign: "center",
    },
    searchingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    searchingText: {
        color: "#fff",
        fontSize: 14,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    statBlock: {
        flex: 1,
        alignItems: "center",
    },
    statLabel: {
        color: "#b0b0b0",
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    primaryButton: {
        backgroundColor: "#FF6A00",
        borderRadius: 32,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    dangerButton: {
        flex: 1,
        backgroundColor: "#c62828",
        borderRadius: 32,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButton: {
        flex: 1,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: "#555",
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    secondaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "500",
    },
});
