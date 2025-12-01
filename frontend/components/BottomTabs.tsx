import React, {useMemo} from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SvgUri } from "react-native-svg";
import { Asset } from "expo-asset";

export type TabKey = "home" | "maps" | "record" | "groups" | "you";

export const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "home", label: "Home" },
    { key: "maps", label: "Maps" },
    { key: "record", label: "Record" },
    { key: "groups", label: "Groups" },
    { key: "you", label: "You" },
];

type Props = {
    activeTab: TabKey;
    onTabPress: (tab: TabKey) => void;
};

const ICONS: Record<TabKey, number> = {
    home: require("../assets/icons/home.svg"),
    maps: require("../assets/icons/map.svg"),
    record: require("../assets/icons/record.svg"),
    groups: require("../assets/icons/group.svg"),
    you: require("../assets/icons/you.svg"),
};

function TabIcon({ tab }: { tab: TabKey }) {
    const uri = useMemo(() => {
        const asset = Asset.fromModule(ICONS[tab]);
        return asset.localUri ?? asset.uri;
    }, [tab]);

    if (!uri) return null;

    return <SvgUri width={22} height={22} uri={uri} />;
}

const BottomTabs: React.FC<Props> = ({ activeTab, onTabPress }) => {
    return (
        <View style={styles.tabBar}>
            {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabItem, isActive && styles.tabItemActive]}
                        onPress={() => onTabPress(tab.key)}
                    >
                        <TabIcon tab={tab.key} />
                        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#1f1f1f",
        backgroundColor: "#141414",
        paddingHorizontal: 8,
        paddingVertical: 10,
        justifyContent: "space-between",
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
        borderRadius: 10,
    },
    tabItemActive: {
        backgroundColor: "#1f1f1f",
    },
    tabEmoji: {
        fontSize: 18,
    },
    tabLabel: {
        marginTop: 4,
        color: "#888",
        fontSize: 12,
        fontWeight: "500",
    },
    tabLabelActive: {
        color: "#fff",
    },
});

export default BottomTabs;
