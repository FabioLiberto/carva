// page/Activity.tsx
import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
} from "react-native";

// Avoid name clash with the component
import { Activity as ActivityModel } from "../model/activity";
import ActivityDetail from "./ActivityDetail";
import type { TrackPoint } from "../hooks/useDriveRecorder";

import { driveImages } from "../components/driveImages";

export const dummyData: ActivityModel[] = [
    {
        id: "1",
        date: new Date("2025-01-15T07:30:00"),
        title: "Morning Drive",
        userReference: "user_001",
        route: "drive_one", // key into driveImages
        duration: 45, // minutes
        distance: 60, // km
        averageSpeed: 80, // km/h
    },
    {
        id: "2",
        date: new Date("2025-01-17T18:15:00"),
        title: "Evening Drive",
        userReference: "user_002",
        route: "drive_two",
        duration: 75,
        distance: 100,
        averageSpeed: 80,
    },
];

function formatDate(date: Date) {
    return date.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    return `${h}h ${m}m`;
}

type ActivityCardProps = {
    activity: ActivityModel;
};

const ActivityCard: React.FC<ActivityCardProps & { onPress?: () => void }> = ({ activity, onPress }) => {
    const imageSource = driveImages[activity.route];

    return (
        <TouchableOpacity activeOpacity={0.7} style={styles.card} onPress={onPress}>
            {/* Top row: type + title + date */}
            <View style={styles.headerRow}>
                <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>🏎️</Text>
                </View>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {activity.title}
                    </Text>
                    <Text style={styles.date}>{formatDate(activity.date)}</Text>
                </View>
            </View>

            {/* Route name */}
            <Text style={styles.route} numberOfLines={1}>
                {activity.route}
            </Text>

            {/* Route image (only if we have one mapped) */}
            {imageSource && (
                <Image
                    source={imageSource}
                    style={styles.routeImage}
                    resizeMode="cover"
                />
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
                <View style={styles.mainStat}>
                    <Text style={styles.mainStatValue}>
                        {activity.distance.toFixed(1)}
                    </Text>
                    <Text style={styles.mainStatLabel}>km</Text>
                </View>

                <View style={styles.subStats}>
                    <View style={styles.subStat}>
                        <Text style={styles.subStatLabel}>Time</Text>
                        <Text style={styles.subStatValue}>
                            {formatDuration(activity.duration)}
                        </Text>
                    </View>
                    <View style={styles.subStat}>
                        <Text style={styles.subStatLabel}>Avg speed</Text>
                        <Text style={styles.subStatValue}>
                            {activity.averageSpeed.toFixed(1)} km/h
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const ActivityScreen: React.FC = () => {
    const [selected, setSelected] = useState<ActivityModel | null>(null);

    const syntheticPoints = useMemo<Record<string, TrackPoint[]>>(() => {
        // create simple synthetic time series per activity for detail view
        const out: Record<string, TrackPoint[]> = {};
        for (const a of dummyData) {
            const n = 120;
            const start = Date.now() - a.duration * 60 * 1000;
            const pts: TrackPoint[] = [];
            let lat = 47.3769;
            let lon = 8.5417;
            for (let i = 0; i < n; i++) {
                const t = start + (i * a.duration * 60 * 1000) / n;
                // wander position slightly, speed around avg
                lat += (Math.random() - 0.5) * 0.0005;
                lon += (Math.random() - 0.5) * 0.0005;
                const wobble = Math.sin((i / n) * Math.PI * 4) * (a.averageSpeed * 0.25);
                const noise = (Math.random() - 0.5) * (a.averageSpeed * 0.15);
                const kmh = Math.max(0, a.averageSpeed + wobble + noise);
                pts.push({ latitude: lat, longitude: lon, timestamp: t, speedMs: kmh / 3.6, altitudeMeters: null });
            }
            out[a.id] = pts;
        }
        return out;
    }, []);

    if (selected) {
        return (
            <ActivityDetail
                activity={selected}
                points={syntheticPoints[selected.id]}
                onBack={() => setSelected(null)}
            />
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={dummyData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <ActivityCard activity={item} onPress={() => setSelected(item)} />
                )}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default ActivityScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101010",
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: "#1b1b1b",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FF6A00",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    iconText: {
        fontSize: 18,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    date: {
        color: "#aaaaaa",
        fontSize: 12,
        marginTop: 2,
    },
    route: {
        color: "#888888",
        fontSize: 12,
        marginTop: 8,
    },
    routeImage: {
        width: "100%",
        height: 120,
        borderRadius: 8,
        marginTop: 10,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginTop: 12,
    },
    mainStat: {
        flex: 1,
    },
    mainStatValue: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "700",
    },
    mainStatLabel: {
        color: "#bbbbbb",
        fontSize: 14,
        marginTop: -4,
    },
    subStats: {
        flexDirection: "row",
        justifyContent: "flex-end",
        flex: 1,
        gap: 16,
    },
    subStat: {
        alignItems: "flex-end",
    },
    subStatLabel: {
        color: "#888888",
        fontSize: 12,
    },
    subStatValue: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "500",
        marginTop: 2,
    },
});
