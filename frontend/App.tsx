import React from "react";
import {SafeAreaView, StatusBar, StyleSheet} from "react-native";
import Activity from "./page/Activity";

export default function App() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content"/>
            <Activity/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101010",
    },
});
