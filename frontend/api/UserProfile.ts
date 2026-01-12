import {User} from "../model/user";

export function getUserProfile(): User {
    return {
        name: "Max Mustermann",
        email: "max@example.com",
        location: "Zürich, Switzerland",
        membership: "Subscriber",
        avatarInitials: "MM",
        bio: "Hobby rider.",
        followingCount: 25,
        totalDrives: 142,
        media: [
            {
                id: "highlight-1",
                label: "Morning laps",
                assetKey: "drive_one",
                type: "photo",
            },
            {
                id: "highlight-2",
                label: "Commute vibes",
                assetKey: "drive_two",
                type: "video",
            },
            {
                id: "highlight-3",
                label: "Gym session",
                assetKey: "drive_one",
                type: "photo",
            },
            {
                id: "highlight-4",
                label: "Weekend ride",
                assetKey: "drive_two",
                type: "photo",
            },
        ],
        weeklySummary: {
            distanceKm: 0,
            timeMinutes: 0,
            elevationMeters: 0,
            trend: [
                { label: "Sep", minutes: 158 },
                { label: "Oct", minutes: 112 },
                { label: "Nov", minutes: 189 },
                { label: "Dec", minutes: 140 },
                { label: "Jan", minutes: 36 },
            ],
        },
    };
}