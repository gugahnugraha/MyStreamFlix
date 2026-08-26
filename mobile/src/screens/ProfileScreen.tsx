import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import {
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Lock,
  Mail,
  Film,
  Sparkles,
  Settings,
  Bookmark,
  History,
  Sliders,
  ChevronRight,
  Crown,
  KeyRound,
  UserPlus,
  LogIn,
  Calendar,
  CheckCircle,
} from "lucide-react-native";
import { User } from "../types";
import { loginUser, registerUser } from "../api/client";

export default function ProfileScreen({ navigation }: any) {
  // Real Database User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [inputName, setInputName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");

  // User Settings
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);

  const handleAuthSubmit = async () => {
    if (!inputEmail || !inputPassword) {
      Alert.alert("Input Required", "Please fill in all credentials.");
      return;
    }

    setLoading(true);

    if (authMode === "login") {
      const result = await loginUser(inputEmail, inputPassword);
      setLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setShowAuthModal(false);
        setInputPassword("");
        Alert.alert(
          "Signed In",
          `Welcome back, ${result.user.name || result.user.email}!`
        );
      } else {
        Alert.alert("Authentication Failed", result.error || "Invalid email or password.");
      }
    } else {
      if (!inputName) {
        setLoading(false);
        Alert.alert("Input Required", "Please enter your name.");
        return;
      }

      const result = await registerUser(inputName, inputEmail, inputPassword);
      setLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setShowAuthModal(false);
        setInputPassword("");
        Alert.alert("Account Created", "Your account has been registered in the database!");
      } else {
        Alert.alert("Registration Failed", result.error || "Could not register account.");
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to log out of your session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          setCurrentUser(null);
        },
      },
    ]);
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Banner & Database User Info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <UserIcon size={38} color="#00ADB5" />
          {isAdmin && (
            <View style={styles.crownBadge}>
              <Crown size={12} color="#000" />
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {currentUser ? currentUser.name || currentUser.email.split("@")[0] : "Guest User"}
        </Text>
        <Text style={styles.email}>
          {currentUser ? currentUser.email : "Not signed in to database"}
        </Text>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.roleBadge,
              isAdmin && { backgroundColor: "rgba(229,9,20,0.15)", borderColor: "#E50914" },
              currentUser?.isPremium && { backgroundColor: "rgba(0,173,181,0.15)", borderColor: "#00ADB5" },
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                isAdmin && { color: "#E50914" },
                currentUser?.isPremium && { color: "#00ADB5" },
              ]}
            >
              {isAdmin
                ? "👑 DATABASE ADMINISTRATOR"
                : currentUser?.isPremium
                ? "⭐ VIP MEMBER"
                : currentUser
                ? "STANDARD USER"
                : "GUEST VISITOR"}
            </Text>
          </View>
        </View>

        {!currentUser ? (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              setAuthMode("login");
              setShowAuthModal(true);
            }}
          >
            <LogIn size={15} color="#000" />
            <Text style={styles.loginBtnText}>Database Sign In / Register</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={14} color="#E50914" />
            <Text style={styles.logoutBtnText}>Sign Out Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Panel Gateway */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATABASE ADMINISTRATION</Text>
        <TouchableOpacity
          style={styles.adminGateCard}
          onPress={() => {
            if (isAdmin) {
              navigation.navigate("Admin");
            } else {
              Alert.alert(
                "Admin Restricted",
                "You must be signed in as an Administrator in the database to access the CMS Dashboard.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Admin Sign In",
                    onPress: () => {
                      setAuthMode("login");
                      setInputEmail("admin@mystreamflix.com");
                      setShowAuthModal(true);
                    },
                  },
                ]
              );
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.adminGateLeft}>
            <View style={styles.adminIconBox}>
              <ShieldCheck size={22} color="#00ADB5" />
            </View>
            <View>
              <Text style={styles.adminGateTitle}>Admin CMS & Auto-Scanner</Text>
              <Text style={styles.adminGateSub}>
                {isAdmin ? "Access granted (Database Verified)" : "Requires Database Admin Account"}
              </Text>
            </View>
          </View>
          <KeyRound size={18} color="#00ADB5" />
        </TouchableOpacity>
      </View>

      {/* Library Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATABASE SYNCED LIBRARY</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <Bookmark size={18} color="#00ADB5" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>My Saved Watchlist</Text>
              <Text style={styles.menuItemSub}>
                {currentUser?.watchlist?.length || 0} saved titles
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <History size={18} color="#E50914" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Watch History & Progress</Text>
              <Text style={styles.menuItemSub}>
                {currentUser?.history?.length || 0} movies watched
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Playback Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PLAYBACK PREFERENCES</Text>

        <View style={styles.switchItem}>
          <View>
            <Text style={styles.switchTitle}>Auto-play Next Episode</Text>
            <Text style={styles.switchSub}>Automatically load the next serial episode</Text>
          </View>
          <Switch
            value={autoPlayNext}
            onValueChange={setAutoPlayNext}
            trackColor={{ false: "#333", true: "#00ADB5" }}
          />
        </View>

        <View style={styles.switchItem}>
          <View>
            <Text style={styles.switchTitle}>ExoPlayer Hardware Acceleration</Text>
            <Text style={styles.switchSub}>Ultra-smooth native hardware decoding</Text>
          </View>
          <Switch
            value={hardwareAcceleration}
            onValueChange={setHardwareAcceleration}
            trackColor={{ false: "#333", true: "#00ADB5" }}
          />
        </View>
      </View>

      {/* System & Database Connection Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATABASE & SYSTEM INFO</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database Endpoint</Text>
          <Text style={styles.infoValue}>https://mystreamflix.biz.id</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue}>{currentUser?.id || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database Auth</Text>
          <Text style={[styles.infoValue, { color: "#10B981" }]}>PostgreSQL / JWT Active</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* Database Auth Modal (Sign In / Register) */}
      <Modal visible={showAuthModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {authMode === "login" ? "Database Sign In" : "Create Account"}
            </Text>
            <Text style={styles.modalSub}>
              {authMode === "login"
                ? "Enter your registered credentials to sign in."
                : "Register a new user account in the MyStreamFlix database."}
            </Text>

            {/* Switch Mode Tabs */}
            <View style={styles.authTabRow}>
              <TouchableOpacity
                onPress={() => setAuthMode("login")}
                style={[styles.authTab, authMode === "login" && styles.authTabActive]}
              >
                <Text style={[styles.authTabText, authMode === "login" && styles.authTabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAuthMode("register")}
                style={[styles.authTab, authMode === "register" && styles.authTabActive]}
              >
                <Text style={[styles.authTabText, authMode === "register" && styles.authTabTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {authMode === "register" && (
              <View style={styles.inputBox}>
                <UserIcon size={16} color="#777" />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#777"
                  value={inputName}
                  onChangeText={setInputName}
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.inputBox}>
              <Mail size={16} color="#777" />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#777"
                value={inputEmail}
                onChangeText={setInputEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputBox}>
              <Lock size={16} color="#777" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#777"
                value={inputPassword}
                onChangeText={setInputPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleAuthSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {authMode === "login" ? "Sign In" : "Register Account"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowAuthModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#121216",
    borderBottomWidth: 1,
    borderColor: "#1E1E24",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(0,173,181,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0,173,181,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  crownBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FACC15",
    padding: 5,
    borderRadius: 12,
  },
  name: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  email: {
    color: "#888",
    fontSize: 12,
    marginBottom: 12,
  },
  badgeRow: {
    marginBottom: 14,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  roleBadgeText: {
    color: "#AAA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00ADB5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  loginBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "rgba(229,9,20,0.12)",
    borderRadius: 8,
  },
  logoutBtnText: {
    color: "#E50914",
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  adminGateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141418",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  adminGateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adminIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(0,173,181,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  adminGateTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  adminGateSub: {
    color: "#888",
    fontSize: 11,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141418",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#22222A",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#1C1C22",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  menuItemSub: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },
  switchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141418",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#22222A",
  },
  switchTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  switchSub: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#1E1E24",
  },
  infoLabel: {
    color: "#777",
    fontSize: 12,
  },
  infoValue: {
    color: "#DDD",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#141418",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2A2A32",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalSub: {
    color: "#888",
    fontSize: 12,
    marginBottom: 16,
  },
  authTabRow: {
    flexDirection: "row",
    backgroundColor: "#1E1E24",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  authTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  authTabActive: {
    backgroundColor: "#00ADB5",
  },
  authTabText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
  },
  authTabTextActive: {
    color: "#000",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E24",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    paddingVertical: 10,
  },
  submitBtn: {
    backgroundColor: "#00ADB5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#888",
    fontSize: 13,
  },
});
