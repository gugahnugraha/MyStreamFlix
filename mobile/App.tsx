import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Film, Radio, Tv } from "lucide-react-native";

import HomeScreen from "./src/screens/HomeScreen";
import LiveTvScreen from "./src/screens/LiveTvScreen";
import PlayerScreen from "./src/screens/PlayerScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F0F12",
          borderTopColor: "#1E1E24",
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#00ADB5",
        tabBarInactiveTintColor: "#777",
      }}
    >
      <Tab.Screen
        name="Catalog"
        component={HomeScreen}
        options={{
          tabBarLabel: "Movies & Series",
          tabBarIcon: ({ color, size }) => <Film color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="LiveTV"
        component={LiveTvScreen}
        options={{
          tabBarLabel: "Live TV",
          tabBarIcon: ({ color, size }) => <Radio color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            orientation: "landscape",
            navigationBarHidden: true,
            statusBarHidden: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
