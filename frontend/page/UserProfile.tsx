import React from "react";
import {StyleSheet, Text, View} from "react-native";
import {User} from "../model/user";

export default function UserProfile({ user }: { user: User }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>User Profile Page</Text>
            <Text style={styles.text}>Name: {user.name}</Text>
            <Text style={styles.text}>Email: {user.email}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#fff",
    },
    text: {
        fontSize: 16,
        marginTop: 4,
        color: "#fff",
    },
});
