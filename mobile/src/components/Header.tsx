import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Search, X, Film, Globe } from "lucide-react-native";
import { useLanguage } from "../context/LanguageContext";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories?: string[];
  brandColor?: string;
}

const DEFAULT_CATEGORIES = [
  "All",
  "Movies",
  "TV Series",
  "Action",
  "Comedy",
  "Drama",
  "Sci-Fi",
  "Animation",
  "Horror",
];

export default function Header({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories = DEFAULT_CATEGORIES,
  brandColor = "#00ADB5",
}: HeaderProps) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Top Row: Brand & Language Switcher */}
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <View style={[styles.logoIcon, { backgroundColor: brandColor }]}>
            <Film size={16} color="#000" />
          </View>
          <Text style={styles.logoText}>
            MyStream<Text style={{ color: brandColor }}>Flix</Text>
          </Text>
        </View>

        {/* 🌐 Language Switcher Pill */}
        <TouchableOpacity
          onPress={toggleLanguage}
          style={styles.langPill}
          activeOpacity={0.8}
        >
          <Globe size={14} color="#00ADB5" />
          <Text style={styles.langText}>
            {language.toUpperCase()} <Text style={styles.langAlt}>/ {language === "id" ? "EN" : "ID"}</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar Input */}
      <View style={styles.searchBar}>
        <Search size={16} color="#777" />
        <TextInput
          placeholder={t.searchPlaceholder}
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={onSearchChange}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <X size={16} color="#AAA" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills Slider */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const label = (t as any)[cat] || cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onCategoryChange(cat)}
              style={[
                styles.categoryPill,
                isActive && { backgroundColor: brandColor, borderColor: brandColor },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  isActive && { color: "#000", fontWeight: "900" },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0A0A0C",
    paddingTop: Platform.OS === "android" ? 12 : 6,
    borderBottomWidth: 1,
    borderColor: "#16161A",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#141418",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22222A",
  },
  langText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  langAlt: {
    color: "#777",
    fontSize: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#22222A",
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    paddingVertical: 0,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "#22222A",
  },
  categoryText: {
    color: "#AAA",
    fontSize: 12,
    fontWeight: "600",
  },
});
