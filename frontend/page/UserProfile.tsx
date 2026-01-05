import React, {useMemo, useState} from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {User} from "../model/user";

const highlightAssets: Record<string, ReturnType<typeof require>> = {
    drive_one: require("../assets/drives/drive_one.png"),
    drive_two: require("../assets/drives/drive_two.png"),
};

const FILTER_OPTIONS = ["All Ride", "Virtual Ride", "Workout", "Weights"];

function formatDuration(minutes: number) {
    if (minutes === 0) {
        return "0h";
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) {
        return `${rest}m`;
    }
    if (rest === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${rest}m`;
}

type ProfileProps = {
    user: User;
};

export default function UserProfile({ user }: ProfileProps) {
    const [activeFilter, setActiveFilter] = useState(FILTER_OPTIONS[0]);
    const maxTrendMinutes = useMemo(() => {
        return user.weeklySummary.trend.reduce(
            (acc, point) => Math.max(acc, point.minutes),
            1,
        );
    }, [user.weeklySummary.trend]);

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user.avatarInitials}</Text>
                    </View>
                    <View style={styles.heroDetails}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{user.membership}</Text>
                        </View>
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.location}>{user.location}</Text>
                        {!!user.bio && <Text style={styles.bio}>{user.bio}</Text>}
                        <View style={styles.quickStatsRow}>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatLabel}>Following</Text>
                                <Text style={styles.quickStatValue}>
                                    {user.followingCount}
                                </Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatLabel}>Total drives</Text>
                                <Text style={styles.quickStatValue}>
                                    {user.totalDrives}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.heroActions}>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>Share my QR Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View>
                <Text style={styles.sectionTitle}>Highlights</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.mediaRow}
                >
                    {user.media.map((item) => {
                        const source = highlightAssets[item.assetKey];
                        return (
                            <View style={styles.mediaCard} key={item.id}>
                                {source ? (
                                    <Image source={source} style={styles.mediaImage} />
                                ) : (
                                    <View style={styles.mediaPlaceholder}>
                                        <Text style={styles.mediaPlaceholderText}>
                                            {item.label.charAt(0)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.mediaLabelRow}>
                                    <Text style={styles.mediaLabel} numberOfLines={1}>
                                        {item.label}
                                    </Text>
                                    {item.type === "video" && (
                                        <View style={styles.mediaBadge}>
                                            <Text style={styles.mediaBadgeText}>▶</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.filterBar}>
                {FILTER_OPTIONS.map((option) => {
                    const isActive = option === activeFilter;
                    return (
                        <TouchableOpacity
                            key={option}
                            onPress={() => setActiveFilter(option)}
                            activeOpacity={0.7}
                            style={[
                                styles.filterChip,
                                isActive && styles.filterChipActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    isActive && styles.filterChipTextActive,
                                ]}
                            >
                                {option}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>This week</Text>
                    <Text style={styles.summarySubtitle}>{activeFilter}</Text>
                </View>

                <View style={styles.summaryMetrics}>
                    <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>Distance</Text>
                        <Text style={styles.metricValue}>
                            {user.weeklySummary.distanceKm.toFixed(2)} km
                        </Text>
                    </View>
                    <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>Time</Text>
                        <Text style={styles.metricValue}>
                            {formatDuration(user.weeklySummary.timeMinutes)}
                        </Text>
                    </View>
                    <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>Elevation</Text>
                        <Text style={styles.metricValue}>
                            {user.weeklySummary.elevationMeters} m
                        </Text>
                    </View>
                </View>

                <View style={styles.trendChart}>
                    {user.weeklySummary.trend.map((point) => {
                        const height =
                            Math.max(point.minutes / maxTrendMinutes, 0.08) * 120;
                        return (
                            <View style={styles.trendColumn} key={point.label}>
                                <View style={styles.trendBarTrack}>
                                    <View
                                        style={[
                                            styles.trendBarFill,
                                            { height },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.trendLabel}>{point.label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.contactCard}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <Text style={styles.contactValue}>{user.email}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#101010",
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 28,
        gap: 24,
    },
    heroCard: {
        backgroundColor: "#191919",
        borderRadius: 18,
        padding: 20,
        gap: 16,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    heroHeader: {
        flexDirection: "row",
        gap: 16,
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#FF6A00",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#101010",
        fontWeight: "700",
        fontSize: 28,
    },
    heroDetails: {
        flex: 1,
        gap: 6,
    },
    badge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(255, 106, 0, 0.12)",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        color: "#FF6A00",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    name: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "700",
    },
    location: {
        color: "#bbbbbb",
        fontSize: 14,
    },
    bio: {
        color: "#9c9c9c",
        fontSize: 13,
        lineHeight: 18,
    },
    quickStatsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 6,
    },
    quickStat: {
        flex: 1,
        gap: 4,
    },
    quickStatLabel: {
        color: "#7c7c7c",
        fontSize: 12,
        fontWeight: "500",
        letterSpacing: 0.2,
        textTransform: "uppercase",
    },
    quickStatValue: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "600",
    },
    statDivider: {
        width: 1,
        height: "90%",
        backgroundColor: "#2b2b2b",
    },
    heroActions: {
        flexDirection: "row",
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: "#FF6A00",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
    },
    primaryButtonText: {
        color: "#101010",
        fontWeight: "700",
        fontSize: 14,
    },
    secondaryButton: {
        flex: 1,
        borderColor: "#FF6A00",
        borderWidth: 1,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
    },
    secondaryButtonText: {
        color: "#FF6A00",
        fontWeight: "600",
        fontSize: 14,
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
    },
    mediaRow: {
        gap: 12,
    },
    mediaCard: {
        width: 140,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#1f1f1f",
    },
    mediaImage: {
        width: "100%",
        height: 92,
    },
    mediaPlaceholder: {
        width: "100%",
        height: 92,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2d2d2d",
    },
    mediaPlaceholderText: {
        color: "#888",
        fontSize: 32,
        fontWeight: "600",
    },
    mediaLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
    },
    mediaLabel: {
        color: "#ffffff",
        fontSize: 13,
        flex: 1,
    },
    mediaBadge: {
        backgroundColor: "rgba(16, 16, 16, 0.72)",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    mediaBadgeText: {
        color: "#FF6A00",
        fontSize: 10,
        fontWeight: "700",
    },
    filterBar: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
    },
    filterChip: {
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: "#1b1b1b",
    },
    filterChipActive: {
        backgroundColor: "#FF6A00",
    },
    filterChipText: {
        color: "#9c9c9c",
        fontSize: 13,
        fontWeight: "600",
    },
    filterChipTextActive: {
        color: "#101010",
    },
    summaryCard: {
        backgroundColor: "#191919",
        borderRadius: 18,
        padding: 20,
        gap: 16,
    },
    summaryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
    },
    summarySubtitle: {
        color: "#7c7c7c",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1.1,
        fontWeight: "600",
    },
    summaryMetrics: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    metricBlock: {
        flex: 1,
        backgroundColor: "#1f1f1f",
        borderRadius: 14,
        padding: 14,
        gap: 8,
    },
    metricLabel: {
        color: "#7c7c7c",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    metricValue: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
    },
    trendChart: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 10,
    },
    trendColumn: {
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    trendBarTrack: {
        width: "100%",
        height: 120,
        borderRadius: 14,
        backgroundColor: "#1f1f1f",
        justifyContent: "flex-end",
        overflow: "hidden",
    },
    trendBarFill: {
        width: "100%",
        backgroundColor: "rgba(255, 106, 0, 0.85)",
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },
    trendLabel: {
        color: "#7c7c7c",
        fontSize: 12,
    },
    contactCard: {
        backgroundColor: "#191919",
        borderRadius: 18,
        padding: 20,
    },
    contactValue: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "500",
    },
});
