export type Group = {
    id: string;
    name: string;
    description: string;
    members: number;
    isMember: boolean;
    createdAt: string;
    ownerId: string;
    ownerName: string;
};

export type GroupDraft = Pick<Group, "name" | "description">;

export function createInitialGroups(currentUserId: string, currentUserName: string): Group[] {
    return [
        {
            id: "group-eco-drivers",
            name: "Eco Drivers Collective",
            description: "Share hypermiling tips and compare efficient routes every week.",
            members: 32,
            isMember: true,
            createdAt: new Date("2024-04-12T18:30:00Z").toISOString(),
            ownerId: currentUserId,
            ownerName: currentUserName,
        },
        {
            id: "group-weekend-rally",
            name: "Weekend Rally Crew",
            description: "Plan scenic drives across the Alps every Saturday morning.",
            members: 18,
            isMember: false,
            createdAt: new Date("2024-09-01T10:15:00Z").toISOString(),
            ownerId: "layla@alpinecrew.com",
            ownerName: "Layla Steiner",
        },
        {
            id: "group-night-owls",
            name: "Night Owls",
            description: "Late night city cruises with emphasis on safety and style.",
            members: 11,
            isMember: false,
            createdAt: new Date("2025-02-19T22:05:00Z").toISOString(),
            ownerId: "darius@midnight.city",
            ownerName: "Darius Cole",
        },
    ];
}


