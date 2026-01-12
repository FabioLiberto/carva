export type UserMedia = {
  id: string;
  label: string;
  assetKey: string;
  type: "photo" | "video";
};

export type WeeklyTrendPoint = {
  label: string;
  minutes: number;
};

export type WeeklySummary = {
  distanceKm: number;
  timeMinutes: number;
  elevationMeters: number;
  trend: WeeklyTrendPoint[];
};

export type User = {
  name: string;
  email: string;
  location: string;
  membership: "Subscriber" | "Free";
  avatarInitials: string;
  bio?: string;
  followingCount: number;
  totalDrives: number;
  media: UserMedia[];
  weeklySummary: WeeklySummary;
};
