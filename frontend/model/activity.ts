export type Activity = {
    id: string;
    date: Date;
    title: string;
    userReference: string;
    route: string;
    duration: number;
    distance: number;
    averageSpeed: number;
    latitude?: number;
    longitude?: number;
}
