import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Home, Film, Tv, Heart, Globe } from "lucide-react-native";
import { useLanguage } from "../context/LanguageContext";
import { useMovies } from "../context/MovieContext";

interface MobileBottomNavProps {
  activeTab: "home" | "movies" | "livetv" | "mylist";
  onTabChange: (tab: "home" | "movies" | "livetv" | "mylist") => void;
}

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const { language, cycleLanguage, t } = useLanguage();
  const { favorites } = useMovies();

  const navItems: Array<{
    id: "home" | "movies" | "livetv" | "mylist" | "language";
    label: string;
    icon: any;
    badge?: number;
    action: () => void;
    isActive: boolean;
  }> = [
    {
      id: "home",
      label: t.home,
      icon: Home,
      isActive: activeTab === "home",
      action: () => onTabChange("home"),
    },
    {
      id: "movies",
      label: t.movies,
      icon: Film,
      isActive: activeTab === "movies",
      action: () => onTabChange("movies"),
    },
    {
      id: "livetv",
      label: t.liveTv,
      icon: Tv,
      isActive: activeTab === "livetv",
      action: () => onTabChange("livetv"),
    },
    {
      id: "mylist",
      label: t.myList,
      icon: Heart,
      badge: favorites.length > 0 ? favorites.length : undefined,
      isActive: activeTab === "mylist",
      action: () => onTabChange("mylist"),
    },
    {
      id: "language",
      label: language.toUpperCase(),
      icon: Globe,
      isActive: false,
      action: cycleLanguage,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navBtn}
              onPress={item.action}
              activeOpacity={0.75}
            >
              <View style={styles.iconWrap}>
                <Icon size={20} color={active ? "#00ADB5" : "#777"} />
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(10,10,14,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingBottom: 16,
    paddingTop: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  iconWrap: {
    position: "relative",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#FF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  navLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  navLabelActive: {
    color: "#00ADB5",
    fontWeight: "800",
  },
});