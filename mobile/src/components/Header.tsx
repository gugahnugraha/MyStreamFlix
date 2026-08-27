import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from "react-native";
import { Film, Sparkles, Search, X, Globe, Crown, User as UserIcon, LogIn } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch: boolean;
  onToggleSearch: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  showSearch,
  onToggleSearch,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
}: HeaderProps) {
  const { currentUser, isLoggedIn, isAdmin } = useAuth();
  const { language, cycleLanguage, t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* Top Brand Bar */}
      <View style={styles.topRow}>
        {/* Brand Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Film size={18} color="#00ADB5" />
            <Sparkles size={10} color="#FFD700" style={styles.sparkle} />
          </View>
          <Text style={styles.logoText}>
            My<Text style={styles.logoAccent}>StreamFlix</Text>
          </Text>
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {/* Search Toggle */}
          <TouchableOpacity style={styles.iconBtn} onPress={onToggleSearch} activeOpacity={0.75}>
            {showSearch ? <X size={18} color="#FFF" /> : <Search size={18} color="#FFF" />}
          </TouchableOpacity>

          {/* Language Switcher */}
          <TouchableOpacity style={styles.langBtn} onPress={cycleLanguage} activeOpacity={0.75}>
            <Globe size={13} color="#00ADB5" />
            <Text style={styles.langText}>{language.toUpperCase()}</Text>
          </TouchableOpacity>

          {/* Admin Crown (if admin) */}
          {isAdmin && onOpenAdmin && (
            <TouchableOpacity style={styles.adminBtn} onPress={onOpenAdmin} activeOpacity={0.75}>
              <Crown size={14} color="#FFD700" />
            </TouchableOpacity>
          )}

          {/* Profile Avatar / Sign In */}
          {isLoggedIn ? (
            <TouchableOpacity style={styles.avatarBtn} onPress={onOpenProfile} activeOpacity={0.75}>
              {currentUser?.profileImage ? (
                <Image source={{ uri: currentUser.profileImage }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserIcon size={14} color="#00ADB5" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signInBtn} onPress={onOpenAuth} activeOpacity={0.8}>
              <LogIn size={13} color="#000" />
              <Text style={styles.signInText}>{t.signIn}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Expandable Search Input Bar */}
      {showSearch && (
        <View style={styles.searchBarWrap}>
          <Search size={16} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => onSearchChange("")} style={styles.clearBtn}>
              <X size={14} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(10,10,12,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingTop: 42,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 40,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    position: "relative",
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0,173,181,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  sparkle: {
    position: "absolute",
    top: -2,
    right: -2,
  },
  logoText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: "#00ADB5",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,173,181,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  langText: {
    color: "#00ADB5",
    fontSize: 11,
    fontWeight: "800",
  },
  adminBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,215,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#00ADB5",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,173,181,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#00ADB5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  signInText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14141E",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.25)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
});