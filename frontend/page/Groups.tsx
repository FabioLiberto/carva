import React, {useEffect, useMemo, useReducer, useState} from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import type {GestureResponderEvent} from "react-native";

import {Group, GroupDraft, createInitialGroups} from "../model/group";
import {getUserProfile} from "../api/UserProfile";
import {Activity as ActivityModel} from "../model/activity";
import {Feather} from "@expo/vector-icons";

type GroupAction =
    | { type: "create"; payload: GroupDraft & { ownerId: string; ownerName: string } }
    | {
        type: "update";
        payload: { id: string; requesterId: string } & GroupDraft;
    }
    | { type: "delete"; payload: { id: string; requesterId: string } }
    | { type: "toggleMembership"; payload: { id: string } };

const createId = () => `group-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;

type GroupActivity = ActivityModel & {
    memberName: string;
};

function seedGroupActivities(): Record<string, GroupActivity[]> {
    return {
        "group-eco-drivers": [
            {
                id: "activity-eco-1",
                date: new Date("2025-01-05T06:30:00Z"),
                title: "Zurich hypermile loop",
                userReference: "peter@skibidi.com",
                route: "drive_one",
                duration: 48,
                distance: 58,
                averageSpeed: 72,
                memberName: "Peter Sigrist",
            },
            {
                id: "activity-eco-2",
                date: new Date("2025-01-12T07:45:00Z"),
                title: "Greifensee sunrise cruise",
                userReference: "linh@eco-drive.io",
                route: "drive_two",
                duration: 54,
                distance: 62,
                averageSpeed: 69,
                memberName: "Linh Tran",
            },
        ],
        "group-weekend-rally": [
            {
                id: "activity-rally-1",
                date: new Date("2025-01-18T08:15:00Z"),
                title: "Alpine switchback session",
                userReference: "layla@alpinecrew.com",
                route: "drive_one",
                duration: 90,
                distance: 128,
                averageSpeed: 85,
                memberName: "Layla Steiner",
            },
            {
                id: "activity-rally-2",
                date: new Date("2025-02-01T09:00:00Z"),
                title: "Luzern lakeside sprint",
                userReference: "dave@weekendrally.io",
                route: "drive_two",
                duration: 76,
                distance: 102,
                averageSpeed: 80,
                memberName: "Dave Romano",
            },
        ],
        "group-night-owls": [
            {
                id: "activity-night-1",
                date: new Date("2025-02-22T22:30:00Z"),
                title: "Midnight city laps",
                userReference: "darius@midnight.city",
                route: "drive_one",
                duration: 64,
                distance: 88,
                averageSpeed: 82,
                memberName: "Darius Cole",
            },
            {
                id: "activity-night-2",
                date: new Date("2025-03-01T23:10:00Z"),
                title: "Riverfront neon cruise",
                userReference: "yara@nightowls.gg",
                route: "drive_two",
                duration: 52,
                distance: 70,
                averageSpeed: 81,
                memberName: "Yara Chen",
            },
        ],
    };
}

function groupReducer(state: Group[], action: GroupAction): Group[] {
    switch (action.type) {
    case "create": {
        const { ownerId, ownerName } = action.payload;
        const trimmedName = action.payload.name.trim();
        const trimmedDescription = action.payload.description.trim();
        const now = new Date().toISOString();
        const newGroup: Group = {
            id: createId(),
            name: trimmedName,
            description: trimmedDescription,
            members: 1,
            isMember: true,
            createdAt: now,
            ownerId,
            ownerName,
        };
        return [newGroup, ...state];
    }
    case "update": {
        const { id, name, description, requesterId } = action.payload;
        return state.map((group) => {
            if (group.id !== id) {
                return group;
            }
            if (group.ownerId !== requesterId) {
                return group;
            }
            return {
                ...group,
                name: name.trim(),
                description: description.trim(),
            };
        });
    }
    case "delete": {
        const { id, requesterId } = action.payload;
        return state.filter((group) => group.id !== id || group.ownerId !== requesterId);
    }
    case "toggleMembership": {
        return state.map((group) => {
            if (group.id !== action.payload.id) {
                return group;
            }
            const joining = !group.isMember;
            const memberDelta = joining ? 1 : -1;
            return {
                ...group,
                isMember: joining,
                members: Math.max(0, group.members + memberDelta),
            };
        });
    }
    default:
        return state;
    }
}

function formatCreatedAt(isoDate: string) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatActivityDate(date: Date) {
    return date.toLocaleString("en-GB", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const initialDraft: GroupDraft = { name: "", description: "" };

const GroupsScreen: React.FC = () => {
    const currentUser = useMemo(() => getUserProfile(), []);
    const [groups, dispatch] = useReducer(
        groupReducer,
        null,
        () => createInitialGroups(currentUser.email, currentUser.name),
    );
    const [draft, setDraft] = useState<GroupDraft>(initialDraft);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isEditorOpen, setEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);
    const activitiesByGroup = useMemo(() => seedGroupActivities(), []);
    useEffect(() => {
        if (!activeGroup) {
            return;
        }
        const refreshed = groups.find((group) => group.id === activeGroup.id);
        if (refreshed && refreshed !== activeGroup) {
            setActiveGroup(refreshed);
        } else if (!refreshed) {
            setActiveGroup(null);
        }
    }, [groups, activeGroup]);

    const totalGroups = groups.length;
    const memberGroups = useMemo(
        () => groups.filter((group) => group.isMember).length,
        [groups],
    );
    const managedGroups = useMemo(
        () => groups.filter((group) => group.ownerId === currentUser.email).length,
        [groups, currentUser.email],
    );

    const sortedGroups = useMemo(() => {
        return [...groups].sort((a, b) => {
            if (a.isMember && !b.isMember) return -1;
            if (!a.isMember && b.isMember) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [groups]);

    const resetForm = () => {
        setDraft(initialDraft);
        setEditingId(null);
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setEditorMode("create");
        resetForm();
    };

    const openCreateModal = () => {
        resetForm();
        setEditorMode("create");
        setEditorOpen(true);
    };

    const handleSubmit = () => {
        const name = draft.name.trim();
        const description = draft.description.trim();

        if (!name) {
            Alert.alert("Missing name", "Please give your group a name before saving.");
            return;
        }

        if (editingId) {
            const groupBeingEdited = groups.find((group) => group.id === editingId);
            if (!groupBeingEdited || groupBeingEdited.ownerId !== currentUser.email) {
                Alert.alert("Not allowed", "Only the creator can update this group.");
                closeEditor();
                return;
            }

            dispatch({
                type: "update",
                payload: {
                    id: editingId,
                    name,
                    description,
                    requesterId: currentUser.email,
                },
            });
        } else {
            dispatch({
                type: "create",
                payload: {
                    name,
                    description,
                    ownerId: currentUser.email,
                    ownerName: currentUser.name,
                },
            });
        }
        closeEditor();
    };

    const startEdit = (group: Group) => {
        if (group.ownerId !== currentUser.email) {
            Alert.alert("Not allowed", "Only the creator can edit this group.");
            return;
        }
        setEditingId(group.id);
        setDraft({ name: group.name, description: group.description });
        setEditorMode("edit");
        setEditorOpen(true);
    };

    const confirmDelete = (group: Group) => {
        if (group.ownerId !== currentUser.email) {
            Alert.alert("Not allowed", "Only the creator can delete this group.");
            return;
        }

        Alert.alert(
            "Delete group",
            `Are you sure you want to delete “${group.name}”?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        dispatch({
                            type: "delete",
                            payload: { id: group.id, requesterId: currentUser.email },
                        });
                        if (activeGroup?.id === group.id) {
                            setActiveGroup(null);
                        }
                    },
                },
            ],
        );
    };

    const toggleMembership = (group: Group) => {
        dispatch({ type: "toggleMembership", payload: { id: group.id } });
    };

    const openGroupDetails = (group: Group) => {
        setActiveGroup(group);
    };

    const closeGroupDetails = () => {
        setActiveGroup(null);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subtitle}>
                Discover driving communities, join your crew, or start a new one in seconds.
            </Text>

            <View style={styles.statsRow}>
                <View style={styles.statChip}>
                    <Text style={styles.statValue}>{totalGroups}</Text>
                    <Text style={styles.statLabel}>total</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statValue}>{memberGroups}</Text>
                    <Text style={styles.statLabel}>joined</Text>
                </View>
                <View style={styles.statChip}>
                    <Text style={styles.statValue}>{managedGroups}</Text>
                    <Text style={styles.statLabel}>managed</Text>
                </View>
            </View>
            <View style={styles.createHint}>
                <Feather name="plus-circle" size={18} color="#FF6A00" />
                <Text style={styles.createHintText}>
                    Tap the orange plus to start your own crew.
                </Text>
            </View>
        </View>
    );

    const renderGroup = ({ item }: { item: Group }) => {
        const isOwner = item.ownerId === currentUser.email;

        const handleEditPress = (event: GestureResponderEvent) => {
            event.stopPropagation();
            startEdit(item);
        };

        const handleDeletePress = (event: GestureResponderEvent) => {
            event.stopPropagation();
            confirmDelete(item);
        };

        const handleTogglePress = (event: GestureResponderEvent) => {
            event.stopPropagation();
            toggleMembership(item);
        };

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openGroupDetails(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderText}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardMeta}>
                            Created {formatCreatedAt(item.createdAt)} ·{" "}
                            {isOwner ? "by you" : `by ${item.ownerName}`}
                        </Text>
                    </View>
                    {isOwner && (
                        <View style={styles.cardHeaderActions}>
                            <TouchableOpacity style={styles.iconButton} onPress={handleEditPress}>
                                <Feather name="edit-3" size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconButton, styles.iconButtonDanger]}
                                onPress={handleDeletePress}
                            >
                                <Feather name="trash-2" size={18} color="#ff9b8e" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <Text style={styles.cardDescription}>
                    {item.description || "No description yet."}
                </Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.memberLabel}>
                        {item.members} member{item.members === 1 ? "" : "s"}
                    </Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[
                                styles.joinButton,
                                item.isMember ? styles.joinButtonActive : styles.joinButtonInactive,
                            ]}
                            onPress={handleTogglePress}
                        >
                            <Feather
                                name={item.isMember ? "log-out" : "log-in"}
                                size={16}
                                color="#fff"
                                style={styles.joinButtonIcon}
                            />
                            <Text style={styles.joinButtonText}>
                                {item.isMember ? "Leave" : "Join"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderActivity = ({ item }: { item: GroupActivity }) => (
        <View style={styles.activityCard}>
            <View style={styles.activityTitleRow}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityDate}>{formatActivityDate(item.date)}</Text>
            </View>
            <Text style={styles.activityMember}>by {item.memberName}</Text>
            <View style={styles.activityStatsRow}>
                <Text style={styles.activityStat}>{item.distance.toFixed(1)} km</Text>
                <Text style={styles.activityStat}>{item.duration} min</Text>
                <Text style={styles.activityStat}>{item.averageSpeed.toFixed(1)} km/h</Text>
            </View>
        </View>
    );

    const handleDetailsToggle = () => {
        if (activeGroup) {
            toggleMembership(activeGroup);
        }
    };

    const renderEditorModal = () => (
        <Modal visible={isEditorOpen} animationType="slide" transparent onRequestClose={closeEditor}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editorMode === "edit" ? "Edit group" : "Create group"}
                        </Text>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={closeEditor}>
                            <Feather name="x" size={20} color="#9fa0a5" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSubtitle}>
                        {editorMode === "edit"
                            ? "Update the name and description for your driving crew."
                            : "Give your crew a name and a quick description to set the vibe."}
                    </Text>
                    <TextInput
                        value={draft.name}
                        onChangeText={(text) => setDraft((prev) => ({ ...prev, name: text }))}
                        placeholder="Group name"
                        placeholderTextColor="#6a6a6a"
                        style={styles.input}
                    />
                    <TextInput
                        value={draft.description}
                        onChangeText={(text) => setDraft((prev) => ({ ...prev, description: text }))}
                        placeholder="What makes this group unique?"
                        placeholderTextColor="#6a6a6a"
                        style={[styles.input, styles.inputMultiline]}
                        multiline
                        numberOfLines={3}
                    />
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
                        <Text style={styles.primaryButtonText}>
                            {editorMode === "edit" ? "Save changes" : "Create group"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (activeGroup) {
        const activities = activitiesByGroup[activeGroup.id] ?? [];
        const isOwner = activeGroup.ownerId === currentUser.email;

        return (
            <View style={styles.container}>
                <FlatList
                    style={styles.detailList}
                    data={activities}
                    keyExtractor={(item) => item.id}
                    renderItem={renderActivity}
                    contentContainerStyle={styles.detailListContent}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListHeaderComponent={() => (
                        <View style={styles.detailHeaderSection}>
                            <View style={styles.detailHeaderRow}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={closeGroupDetails}
                                >
                                    <Feather name="arrow-left" size={20} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.detailHeaderText}>
                                    <Text style={styles.detailTitle}>{activeGroup.name}</Text>
                                    <Text style={styles.detailMeta}>
                                        Owned by {isOwner ? "you" : activeGroup.ownerName} •{" "}
                                        {activeGroup.members} member
                                        {activeGroup.members === 1 ? "" : "s"}
                                    </Text>
                                </View>
                                {isOwner && (
                                    <View style={styles.detailHeaderActions}>
                                        <TouchableOpacity
                                            style={styles.iconButton}
                                            onPress={() => startEdit(activeGroup)}
                                        >
                                            <Feather name="edit-3" size={18} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.iconButton, styles.iconButtonDanger]}
                                            onPress={() => confirmDelete(activeGroup)}
                                        >
                                            <Feather name="trash-2" size={18} color="#ff9b8e" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.detailDescription}>
                                {activeGroup.description || "No description yet."}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.joinButton,
                                    styles.detailsJoinButton,
                                    activeGroup.isMember
                                        ? styles.joinButtonActive
                                        : styles.joinButtonInactive,
                                ]}
                                onPress={handleDetailsToggle}
                                activeOpacity={0.85}
                            >
                                <Feather
                                    name={activeGroup.isMember ? "log-out" : "log-in"}
                                    size={16}
                                    color="#fff"
                                    style={styles.joinButtonIcon}
                                />
                                <Text style={styles.joinButtonText}>
                                    {activeGroup.isMember ? "Leave group" : "Join group"}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.detailSectionTitle}>Latest drives</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.activityEmpty}>
                            Activities from members will appear here once drives are shared.
                        </Text>
                    }
                />
                {renderEditorModal()}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={sortedGroups}
                keyExtractor={(item) => item.id}
                renderItem={renderGroup}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
                ListEmptyComponent={
                    <Text style={styles.emptyState}>
                        Start by creating your first group to bring drivers together.
                    </Text>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.85}>
                <Feather name="plus" size={26} color="#fff" />
            </TouchableOpacity>

            {renderEditorModal()}
        </View>
    );
};

export default GroupsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101010",
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 16,
        gap: 12,
    },
    title: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 6,
    },
    subtitle: {
        color: "#9fa0a5",
        fontSize: 14,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 16,
        flexWrap: "wrap",
    },
    statChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: "#1b1b1b",
        borderRadius: 12,
    },
    statValue: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    statLabel: {
        color: "#7d7e84",
        fontSize: 12,
        marginTop: 2,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    createHint: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        marginTop: 18,
    },
    createHintText: {
        color: "#7d7e84",
        fontSize: 13,
    },
    card: {
        backgroundColor: "#1b1b1b",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#242424",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "600",
    },
    cardMeta: {
        color: "#7d7e84",
        fontSize: 12,
        marginTop: 4,
    },
    cardHeaderActions: {
        flexDirection: "row",
        gap: 8,
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#242424",
        alignItems: "center",
        justifyContent: "center",
    },
    iconButtonDanger: {
        backgroundColor: "#2f1c1c",
    },
    cardDescription: {
        color: "#c4c5ca",
        fontSize: 14,
        lineHeight: 20,
        marginTop: 12,
    },
    cardFooter: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    memberLabel: {
        color: "#9fa0a5",
        fontSize: 13,
    },
    actionRow: {
        flexDirection: "row",
    },
    joinButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 18,
    },
    joinButtonActive: {
        backgroundColor: "#2f2f2f",
    },
    joinButtonInactive: {
        backgroundColor: "#FF6A00",
    },
    joinButtonIcon: {
        marginRight: 2,
    },
    joinButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FF6A00",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 480,
        backgroundColor: "#181818",
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
    },
    modalHeaderText: {
        flex: 1,
        gap: 4,
    },
    modalTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    modalSubtitle: {
        color: "#8f9096",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 8,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#242424",
        alignItems: "center",
        justifyContent: "center",
    },
    input: {
        backgroundColor: "#1f1f1f",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#2f2f2f",
        color: "#fff",
        fontSize: 14,
        marginTop: 16,
    },
    inputMultiline: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    primaryButton: {
        marginTop: 20,
        backgroundColor: "#FF6A00",
        borderRadius: 28,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
    detailList: {
        flex: 1,
    },
    detailListContent: {
        padding: 16,
        paddingBottom: 32,
    },
    detailHeaderSection: {
        gap: 16,
        marginBottom: 8,
    },
    detailHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#242424",
        alignItems: "center",
        justifyContent: "center",
    },
    detailHeaderText: {
        flex: 1,
    },
    detailTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },
    detailMeta: {
        color: "#7d7e84",
        fontSize: 12,
        marginTop: 4,
    },
    detailHeaderActions: {
        flexDirection: "row",
        gap: 8,
    },
    detailDescription: {
        color: "#c4c5ca",
        fontSize: 14,
        lineHeight: 20,
    },
    detailsJoinButton: {
        alignSelf: "stretch",
        justifyContent: "center",
        marginBottom: 18,
    },
    detailSectionTitle: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    activityCard: {
        backgroundColor: "#202020",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    activityTitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
    },
    activityTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        flex: 1,
    },
    activityDate: {
        color: "#7d7e84",
        fontSize: 12,
    },
    activityMember: {
        color: "#9fa0a5",
        fontSize: 13,
        marginTop: 6,
    },
    activityStatsRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 12,
    },
    activityStat: {
        color: "#fff",
        fontSize: 13,
        backgroundColor: "#2f2f2f",
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    activityEmpty: {
        color: "#8f9096",
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 24,
    },
    emptyState: {
        color: "#8f9096",
        textAlign: "center",
        paddingVertical: 48,
        fontSize: 14,
    },
});


