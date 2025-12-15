// page/Activity.tsx
import React from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageSourcePropType,
} from "react-native";

// Avoid name clash with the component
import { Activity as ActivityModel } from "../model/activity";

// All drive images, typed with a string index so TS is happy
export const driveImages: Record<string, ImageSourcePropType> = {
    drive_one: require("../assets/drives/drive_one.png"),
    drive_two: require("../assets/drives/drive_two.png"),
    // add more here as needed
};

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

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
    const imageSource = driveImages[activity.route];

    return (
        <TouchableOpacity activeOpacity={0.7} style={styles.card}>
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
    return (
        <View style={styles.container}>
            <FlatList
                data={dummyData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => <ActivityCard activity={item} />}
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
