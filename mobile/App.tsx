import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Film, Radio, User as UserIcon } from "lucide-react-native";

import HomeScreen from "./src/screens/HomeScreen";
import LiveTvScreen from "./src/screens/LiveTvScreen";
import PlayerScreen from "./src/screens/PlayerScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AdminScreen from "./src/screens/AdminScreen";
import { LanguageProvider, useLanguage } from "./src/context/LanguageContext";
import { ModernDialogProvider } from "./src/context/ModernDialogContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F0F12",
          borderTopColor: "#1A1A20",
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#00ADB5",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tab.Screen
        name="Catalog"
        component={HomeScreen}
        options={{
          tabBarLabel: t.moviesSeries,
          tabBarIcon: ({ color, size }) => <Film color={color} size={size} />,
        }}
      />

      {/* 📺 Live TV Tab */}
      <Tab.Screen
        name="LiveTV"
        component={LiveTvScreen}
        options={{
          tabBarLabel: t.liveTv,
          tabBarIcon: ({ color }) => <Radio color={color} size={22} />,
          tabBarActiveTintColor: "#00ADB5",
        }}
      />

      {/* 👤 Profile Tab */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: t.profile,
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ModernDialogProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: "fade",
            }}
          >
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen
              name="Player"
              component={PlayerScreen}
              options={{
                orientation: "default",
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ModernDialogProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  liveIconWrap: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  liveDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E50914",
  },
});
