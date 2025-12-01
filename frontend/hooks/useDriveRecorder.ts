import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as Location from "expo-location";

export type TrackPoint = {
    latitude: number;
    longitude: number;
    timestamp: number;
    speedMs?: number | null;
};

export type RecorderState = "idle" | "recording" | "paused" | "finished";

type RecorderHook = {
    state: RecorderState;
    points: TrackPoint[];
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reset: () => void;
    error: string | null;
    distanceMeters: number;
    durationSeconds: number;
    avgSpeedKmh: number;
    startedAt: number | null;
    endedAt: number | null;
};

const WATCH_OPTIONS: Location.LocationOptions = {
    accuracy: Location.Accuracy.Highest,
    timeInterval: 2000,
    distanceInterval: 5,
};

function haversineDistance(prev: TrackPoint, next: TrackPoint) {
    const R = 6371000; // meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(next.latitude - prev.latitude);
    const dLon = toRad(next.longitude - prev.longitude);
    const lat1 = toRad(prev.latitude);
    const lat2 = toRad(next.latitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function useDriveRecorder(): RecorderHook {
    const [state, setState] = useState<RecorderState>("idle");
    const [points, setPoints] = useState<TrackPoint[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [endedAt, setEndedAt] = useState<number | null>(null);
    const [now, setNow] = useState<number>(Date.now());

    const watcherRef = useRef<Location.LocationSubscription | null>(null);
    const permissionGrantedRef = useRef(false);

    // request permissions on mount
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== Location.PermissionStatus.GRANTED) {
                setError("Location permission is required to record drives.");
                permissionGrantedRef.current = false;
                return;
            }
            permissionGrantedRef.current = true;
        })();

        return () => {
            watcherRef.current?.remove();
            watcherRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (state !== "recording") {
            return;
        }

        const intervalId = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(intervalId);
    }, [state]);

    const addPoint = useCallback((location: Location.LocationObject) => {
        const {
            coords: { latitude, longitude, speed },
            timestamp,
        } = location;

        setPoints((prev) => [
            ...prev,
            {
                latitude,
                longitude,
                timestamp,
                speedMs: speed,
            },
        ]);
    }, []);

    const ensureStopped = useCallback(async () => {
        if (watcherRef.current) {
            await watcherRef.current.remove();
            watcherRef.current = null;
        }
    }, []);

    const start = useCallback(async () => {
        if (!permissionGrantedRef.current) {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== Location.PermissionStatus.GRANTED) {
                setError("Location permission is required to start recording.");
                return;
            }
            permissionGrantedRef.current = true;
        }
        if (state === "recording") {
            return;
        }

        setError(null);
        setPoints([]);
        setStartedAt(Date.now());
        setNow(Date.now());
        setEndedAt(null);
        setState("recording");

        watcherRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, addPoint);
    }, [addPoint, state]);

    const stop = useCallback(async () => {
        if (state !== "recording") {
            return;
        }
        await ensureStopped();
        setEndedAt(Date.now());
        setState("finished");
    }, [ensureStopped, state]);

    const reset = useCallback(() => {
        ensureStopped();
        setState("idle");
        setPoints([]);
        setStartedAt(null);
        setEndedAt(null);
        setError(null);
    }, [ensureStopped]);

    const distanceMeters = useMemo(() => {
        if (points.length < 2) {
            return 0;
        }
        return points.slice(1).reduce((acc, point, idx) => {
            const prev = points[idx];
            return acc + haversineDistance(prev, point);
        }, 0);
    }, [points]);

    const durationSeconds = useMemo(() => {
        if (!startedAt) return 0;
        const lastPointTimestamp = points[points.length - 1]?.timestamp;
        const currentTime = state === "recording" ? now : Date.now();
        const end = endedAt ?? lastPointTimestamp ?? currentTime;
        return Math.max(0, Math.round((end - startedAt) / 1000));
    }, [startedAt, endedAt, state, points, now]);

    const avgSpeedKmh = useMemo(() => {
        if (durationSeconds === 0) return 0;
        const hours = durationSeconds / 3600;
        return (distanceMeters / 1000) / hours;
    }, [distanceMeters, durationSeconds]);

    return {
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
    };
}

export default useDriveRecorder;
