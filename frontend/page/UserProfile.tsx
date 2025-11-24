import React from "react";
import {Text, View} from "react-native";
import {User} from "../model/user";

export default function UserProfile({ user }: { user: User }) {
    return (
        <View style={{padding: 16}}>
            <Text style={{fontSize: 20, fontWeight: "bold", marginBottom: 12}}>
                User Profile Page
            </Text>
            <Text style={{fontSize: 16}}>Name: {user.name}</Text>
            <Text style={{fontSize: 16, marginTop: 4}}>Email: {user.email}</Text>
        </View>
    );
}