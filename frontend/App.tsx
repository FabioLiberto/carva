import React, {useMemo, useState} from "react";
import {SafeAreaView, StatusBar, StyleSheet, View, Text} from "react-native";
import Activity from "./page/Activity";
import RecordDrive from "./page/RecordDrive";
import Groups from "./page/Groups";
import BottomTabs, {TabKey} from "./components/BottomTabs";
import UserProfile from "./page/UserProfile";
import {getUserProfile} from "./api/UserProfile";
import Maps from "./page/Maps";

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
    const userProfile = useMemo(() => getUserProfile(), []);

    const content = useMemo(() => {
        switch (activeTab) {
        case "home":
            return <Activity />;
        case "record":
            return <RecordDrive onFinished={() => setActiveTab("home")} />;
        case "maps":
            return <Maps />;
        case "groups":
            return <Groups />;
        case "you":
        default:
            return (
                <View style={styles.profileScreen}>
                    <UserProfile user={userProfile} />
                </View>
            );
        }
    }, [activeTab, userProfile]);

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
    profileScreen: {
        flex: 1,
        backgroundColor: "#101010",
    },
});
