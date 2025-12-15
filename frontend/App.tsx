import React, {useMemo, useState} from "react";
import {SafeAreaView, StatusBar, StyleSheet, View, Text} from "react-native";
import Activity from "./page/Activity";
import RecordDrive from "./page/RecordDrive";
import BottomTabs, {TabKey} from "./components/BottomTabs";

function PlaceholderScreen({ title, description }: { title: string; description: string }) {
    return (
        <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderTitle}>{title}</Text>
            <Text style={styles.placeholderText}>{description}</Text>
        </View>
    );
}

export default function App() {
    const [activeTab, setActiveTab] = useState<TabKey>("home");

    const content = useMemo(() => {
        switch (activeTab) {
        case "home":
            return <Activity />;
        case "record":
            return <RecordDrive onFinished={() => setActiveTab("home")} />;
        case "maps":
            return (
                <PlaceholderScreen
                    title="Maps"
                    description="Coming soon: explore nearby drives and routes."
                />
            );
        case "groups":
            return (
                <PlaceholderScreen
                    title="Groups"
                    description="Team up with friends, share rides, and compare stats."
                />
            );
        case "you":
        default:
            return (
                <PlaceholderScreen
                    title="You"
                    description="Track your recent activity and tune your profile."
                />
            );
        }
    }, [activeTab]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content"/>
            <View style={styles.screen}>{content}</View>
            <BottomTabs activeTab={activeTab} onTabPress={setActiveTab} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101010",
    },
    screen: {
        flex: 1,
    },
    placeholderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    placeholderTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
    },
    placeholderText: {
        color: "#aaaaaa",
        fontSize: 14,
        textAlign: "center",
    },
});
