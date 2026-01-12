import React, { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from "react-native";
import Svg, { Path, Rect, Line, G, Text as SvgText } from "react-native-svg";
import type { Activity as ActivityModel } from "../model/activity";
import type { TrackPoint } from "../hooks/useDriveRecorder";
import type { Region } from "react-native-maps";
import { darkMapStyle } from "../components/mapStyle";
import { driveImages } from "../components/driveImages";
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from "../components/MapKit";

type Props = {
    activity: ActivityModel;
    points?: TrackPoint[];
    onBack?: () => void;
};

// Utilities
function formatDurationTotal(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m}m`;
    return `${h}h ${m}m`;
}

function kmhFromMs(ms?: number | null) {
    if (ms == null) return 0;
    return Math.max(0, (ms ?? 0) * 3.6);
}

// If no points are provided, synthesize a plausible speed series around average speed
function synthesizeSpeedSeries(activity: ActivityModel, samples = 120) {
    const avg = activity.averageSpeed;
    const durationSec = activity.duration * 60;
    const dt = durationSec / samples; // seconds per sample
    const arr: { t: number; v: number }[] = [];
    let phase = Math.random() * Math.PI * 2;
    for (let i = 0; i < samples; i++) {
        // Simple wavy speed profile around avg
        const wobble = Math.sin(phase + (i / samples) * Math.PI * 4) * (avg * 0.25);
        const noise = (Math.random() - 0.5) * (avg * 0.15);
        const base = Math.max(0, avg + wobble + noise);
        const value = Math.min(Math.max(base, 0), avg * 1.8);
        arr.push({ t: i * dt, v: value });
    }
    return arr;
}

function toSpeedSeries(points?: TrackPoint[], activity?: ActivityModel) {
    if (points && points.length > 1) {
        const t0 = points[0].timestamp;
        return points.map((p) => ({ t: (p.timestamp - t0) / 1000, v: kmhFromMs(p.speedMs) }));
    }
    if (activity) return synthesizeSpeedSeries(activity);
    return [];
}

const FALLBACK_REGION: Region = {
    latitude: 47.3769,
    longitude: 8.5417,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

function regionFromPoints(points?: TrackPoint[]): Region {
    if (!points || points.length === 0) return FALLBACK_REGION;
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLon = points[0].longitude;
    let maxLon = points[0].longitude;
    for (const p of points) {
        minLat = Math.min(minLat, p.latitude);
        maxLat = Math.max(maxLat, p.latitude);
        minLon = Math.min(minLon, p.longitude);
        maxLon = Math.max(maxLon, p.longitude);
    }
    const pad = 0.005;
    const latDelta = Math.max(0.01, (maxLat - minLat) + pad);
    const lonDelta = Math.max(0.01, (maxLon - minLon) + pad);
    return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
    };
}

function regionForActivity(activity: ActivityModel, points?: TrackPoint[]): Region {
    if (typeof activity.latitude === "number" && typeof activity.longitude === "number") {
        return {
            latitude: activity.latitude,
            longitude: activity.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    }
    if (points && points.length) return regionFromPoints(points);
    return FALLBACK_REGION;
}

function computeStats(series: { t: number; v: number }[], activity: ActivityModel) {
    if (series.length === 0) {
        return {
            max: activity.averageSpeed * 1.4,
            avg: activity.averageSpeed,
            p95: activity.averageSpeed * 1.25,
            zones: { z0: 0.1, z1: 0.15, z2: 0.25, z3: 0.2, z4: 0.15, z5: 0.1, z6: 0.05 },
            stops: 0,
        };
    }
    let max = 0;
    let sum = 0;
    const values = series.map((s) => s.v);
    values.forEach((v) => {
        max = Math.max(max, v);
        sum += v;
    });
    const sorted = [...values].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;

    // Zones in km/h up to 120+
    const bins = [0, 20, 40, 60, 80, 100, 120];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    values.forEach((v) => {
        if (v < bins[1]) counts[0]++;
        else if (v < bins[2]) counts[1]++;
        else if (v < bins[3]) counts[2]++;
        else if (v < bins[4]) counts[3]++;
        else if (v < bins[5]) counts[4]++;
        else if (v < bins[6]) counts[5]++;
        else counts[6]++;
    });
    const total = Math.max(1, values.length);
    const zones = {
        z0: counts[0] / total,
        z1: counts[1] / total,
        z2: counts[2] / total,
        z3: counts[3] / total,
        z4: counts[4] / total,
        z5: counts[5] / total,
        z6: counts[6] / total,
    };

    // Naive stop detection: consecutive samples < 1.5 km/h
    let stops = 0;
    let streak = 0;
    values.forEach((v) => {
        if (v < 1.5) {
            streak++;
            if (streak === 3) stops++;
        } else {
            streak = 0;
        }
    });

    return { max, avg: sum / total, p95, zones, stops };
}

function SpeedLineChart({ series }: { series: { t: number; v: number }[] }) {
    const width = 320;
    const height = 120;
    const padding = 14;

    const { path, yMax } = useMemo(() => {
        if (series.length === 0) {
            return { path: "", yMax: 100 };
        }
        const maxY = Math.max(10, ...series.map((s) => s.v));
        const maxX = Math.max(1, ...series.map((s) => s.t));
        const sx = (x: number) => padding + (x / maxX) * (width - padding * 2);
        const sy = (y: number) => height - padding - (y / maxY) * (height - padding * 2);
        let d = `M ${sx(series[0].t)} ${sy(series[0].v)}`;
        for (let i = 1; i < series.length; i++) {
            d += ` L ${sx(series[i].t)} ${sy(series[i].v)}`;
        }
        return { path: d, yMax: maxY };
    }, [series]);

    return (
        <Svg width={width} height={height}>
            <Rect x={0} y={0} width={width} height={height} fill="#0f0f0f" rx={8} />
            {/* axes */}
            <G>
                <Line x1={12} y1={height - 12} x2={width - 12} y2={height - 12} stroke="#2a2a2a" strokeWidth={1} />
                <Line x1={12} y1={12} x2={12} y2={height - 12} stroke="#2a2a2a" strokeWidth={1} />
                <SvgText x={width - 16} y={height - 16} fill="#777" fontSize={10} textAnchor="end">
                    time
                </SvgText>
                <SvgText x={16} y={20} fill="#777" fontSize={10}>
                    {Math.round(yMax)} km/h
                </SvgText>
            </G>
            {/* line */}
            {path ? <Path d={path} stroke="#FF6A00" strokeWidth={2} fill="none" /> : null}
        </Svg>
    );
}

function ZonesBar({ zones }: { zones: { z0: number; z1: number; z2: number; z3: number; z4: number; z5: number; z6: number } }) {
    const width = 320;
    const height = 18;
    const colors = ["#3b3b3b", "#2b4c7e", "#226633", "#8a6f00", "#b26500", "#8b2a2a", "#6b1b68"];
    const vals = [zones.z0, zones.z1, zones.z2, zones.z3, zones.z4, zones.z5, zones.z6];
    const w = vals.map((v) => Math.max(0, v) * width);
    let x = 0;
    const rects = w.map((rw, i) => {
        const r = <Rect key={i} x={x} y={0} width={rw} height={height} fill={colors[i]} />;
        x += rw;
        return r;
    });
    return (
        <Svg width={width} height={height}>
            <Rect x={0} y={0} width={width} height={height} fill="#0f0f0f" rx={9} />
            {rects}
        </Svg>
    );
}

const ActivityDetail: React.FC<Props> = ({ activity, points, onBack }) => {
    const series = useMemo(() => toSpeedSeries(points, activity), [points, activity]);
    const stats = useMemo(() => computeStats(series, activity), [series, activity]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{activity.title}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryBlock}>
                        <Text style={styles.summaryLabel}>Distance</Text>
                        <Text style={styles.summaryValue}>{activity.distance.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.summaryBlock}>
                        <Text style={styles.summaryLabel}>Duration</Text>
                        <Text style={styles.summaryValue}>{formatDurationTotal(activity.duration)}</Text>
                    </View>
                    <View style={styles.summaryBlock}>
                        <Text style={styles.summaryLabel}>Avg speed</Text>
                        <Text style={styles.summaryValue}>{activity.averageSpeed.toFixed(1)} km/h</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Route</Text>
                    {driveImages[activity.route] ? (
                        <Image source={driveImages[activity.route]} style={styles.routeImage} resizeMode="cover" />
                    ) : MapView ? (
                        <View style={styles.mapWrapper}>
                            <MapView
                                style={styles.map}
                                provider={PROVIDER_GOOGLE ?? undefined}
                                initialRegion={regionForActivity(activity, points)}
                                customMapStyle={darkMapStyle}
                                showsUserLocation={false}
                            >
                                {points && points.length > 1 && (
                                    <Polyline
                                        coordinates={points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
                                        strokeWidth={4}
                                        strokeColor="#FF6A00"
                                    />
                                )}
                                {points && points.length > 0 && Marker && (
                                    <>
                                        <Marker
                                            coordinate={{ latitude: points[0].latitude, longitude: points[0].longitude }}
                                            pinColor="#2e7d32"
                                            title="Start"
                                        />
                                        <Marker
                                            coordinate={{ latitude: points[points.length - 1].latitude, longitude: points[points.length - 1].longitude }}
                                            pinColor="#c62828"
                                            title="End"
                                        />
                                    </>
                                )}
                                {(!points || points.length === 0) && Marker && typeof activity.latitude === 'number' && typeof activity.longitude === 'number' && (
                                    <Marker
                                        coordinate={{ latitude: activity.latitude!, longitude: activity.longitude! }}
                                        pinColor="#FF6A00"
                                        title={activity.title}
                                    />
                                )}
                            </MapView>
                            {(() => {
                                const latest = points && points.length > 0
                                    ? { lat: points[points.length - 1].latitude, lon: points[points.length - 1].longitude, alt: points[points.length - 1].altitudeMeters }
                                    : (typeof activity.latitude === "number" && typeof activity.longitude === "number"
                                        ? { lat: activity.latitude, lon: activity.longitude, alt: null as number | null }
                                        : null);
                                return latest ? (
                                    <View style={styles.mapOverlay}>
                                        <Text style={styles.mapOverlayText}>
                                            Lat: {latest.lat.toFixed(5)}  Lon: {latest.lon.toFixed(5)}
                                        </Text>
                                        {latest.alt != null && (
                                            <Text style={styles.mapOverlayText}>Alt: {Math.round(latest.alt)} m</Text>
                                        )}
                                    </View>
                                ) : null;
                            })()}
                        </View>
                    ) : (
                        <View style={styles.mapFallback}>
                            <Text style={styles.mapFallbackTitle}>Preview unavailable</Text>
                            <Text style={styles.mapFallbackText}>
                                No preview image found and map module is unavailable.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Speed over time</Text>
                    <SpeedLineChart series={series} />
                    <View style={styles.inlineStats}>
                        <Text style={styles.inlineStat}>Max: {stats.max.toFixed(1)} km/h</Text>
                        <Text style={styles.inlineStat}>p95: {stats.p95.toFixed(1)} km/h</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Speed zones</Text>
                    <ZonesBar zones={stats.zones} />
                    <View style={styles.zoneLegendRow}>
                        <Text style={styles.zoneLegend}>0–20</Text>
                        <Text style={styles.zoneLegend}>20–40</Text>
                        <Text style={styles.zoneLegend}>40–60</Text>
                        <Text style={styles.zoneLegend}>60–80</Text>
                        <Text style={styles.zoneLegend}>80–100</Text>
                        <Text style={styles.zoneLegend}>100–120</Text>
                        <Text style={styles.zoneLegend}>120+</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Insights</Text>
                    <View style={styles.insightRow}>
                        <Text style={styles.insightLabel}>Stops</Text>
                        <Text style={styles.insightValue}>{stats.stops}</Text>
                    </View>
                    <View style={styles.insightRow}>
                        <Text style={styles.insightLabel}>Route</Text>
                        <Text style={styles.insightValue}>{activity.route}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default ActivityDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101010",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#222",
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#2a2a2a",
    },
    backIcon: {
        color: "#ffffff",
        fontSize: 20,
        marginTop: -2,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        maxWidth: "70%",
        textAlign: "center",
    },
    content: {
        padding: 16,
        gap: 12,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    summaryBlock: {
        flex: 1,
        backgroundColor: "#1b1b1b",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#252525",
    },
    summaryLabel: {
        color: "#a7a7a7",
        fontSize: 12,
        marginBottom: 4,
    },
    summaryValue: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#1b1b1b",
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#252525",
        gap: 10,
    },
    mapWrapper: {
        height: 220,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#0f0f0f",
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapOverlay: {
        position: "absolute",
        left: 8,
        top: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
    },
    mapOverlayText: {
        color: "#fff",
        fontSize: 12,
    },
    cardTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    routeImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
    },
    inlineStats: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    inlineStat: {
        color: "#cfcfcf",
        fontSize: 12,
    },
    zoneLegendRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    zoneLegend: {
        color: "#8f8f8f",
        fontSize: 11,
    },
    insightRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    insightLabel: {
        color: "#a7a7a7",
        fontSize: 14,
    },
    insightValue: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    mapFallback: {
        height: 220,
        borderRadius: 12,
        backgroundColor: "#0f0f0f",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    mapFallbackTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 6,
    },
    mapFallbackText: {
        color: "#9fa0a5",
        fontSize: 13,
        lineHeight: 18,
        textAlign: "center",
    },
});
