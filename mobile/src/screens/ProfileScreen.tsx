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
} from "react-native";
import {
  User,
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
  Bell,
  ChevronRight,
  Crown,
  KeyRound,
  CheckCircle,
} from "lucide-react-native";

export default function ProfileScreen({ navigation }: any) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "vip" | "free">("admin");
  const [email, setEmail] = useState("admin@mystreamflix.com");
  const [name, setName] = useState("Gugah Nugraha");

  // Setting switches matching web
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState("1080p Full HD");

  // Login Modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");

  const handleLogin = () => {
    if (!inputEmail || !inputPassword) {
      Alert.alert("Error", "Please fill in email and password.");
      return;
    }

    if (inputEmail.toLowerCase().includes("admin") || inputPassword === "admin123") {
      setUserRole("admin");
      setName("Super Administrator");
      setEmail(inputEmail);
    } else {
      setUserRole("vip");
      setName(inputEmail.split("@")[0]);
      setEmail(inputEmail);
    }

    setIsLoggedIn(true);
    setShowLoginModal(false);
    Alert.alert("Success", `Logged in as ${inputEmail}`);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          setIsLoggedIn(false);
          setUserRole("free");
          setName("Guest Explorer");
          setEmail("guest@mystreamflix.com");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Banner & Avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={38} color="#00ADB5" />
          {userRole === "admin" && (
            <View style={styles.crownBadge}>
              <Crown size={12} color="#000" />
            </View>
          )}
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.roleBadge,
              userRole === "admin" && { backgroundColor: "rgba(229,9,20,0.15)", borderColor: "#E50914" },
              userRole === "vip" && { backgroundColor: "rgba(0,173,181,0.15)", borderColor: "#00ADB5" },
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                userRole === "admin" && { color: "#E50914" },
                userRole === "vip" && { color: "#00ADB5" },
              ]}
            >
              {userRole === "admin" ? "👑 SUPER ADMIN" : userRole === "vip" ? "⭐ VIP MEMBER" : "FREE USER"}
            </Text>
          </View>
        </View>

        {!isLoggedIn ? (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => setShowLoginModal(true)}
          >
            <Text style={styles.loginBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={14} color="#E50914" />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Panel Gateway (Protected) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADMINISTRATION</Text>
        <TouchableOpacity
          style={styles.adminGateCard}
          onPress={() => navigation.navigate("Admin")}
          activeOpacity={0.8}
        >
          <View style={styles.adminGateLeft}>
            <View style={styles.adminIconBox}>
              <ShieldCheck size={22} color="#00ADB5" />
            </View>
            <View>
              <Text style={styles.adminGateTitle}>Admin CMS & Auto-Scanner</Text>
              <Text style={styles.adminGateSub}>PIN-protected catalog & stream dashboard</Text>
            </View>
          </View>
          <KeyRound size={18} color="#00ADB5" />
        </TouchableOpacity>
      </View>

      {/* Watchlist & History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LIBRARY</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <Bookmark size={18} color="#00ADB5" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>My Saved Watchlist</Text>
              <Text style={styles.menuItemSub}>0 saved titles</Text>
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
              <Text style={styles.menuItemTitle}>Watch History & Resume</Text>
              <Text style={styles.menuItemSub}>Continue watching recent movies</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Playback & Streaming Preferences */}
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
            <Text style={styles.switchSub}>Ultra-smooth 60fps native decoding</Text>
          </View>
          <Switch
            value={hardwareAcceleration}
            onValueChange={setHardwareAcceleration}
            trackColor={{ false: "#333", true: "#00ADB5" }}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Application</Text>
          <Text style={styles.infoValue}>MyStreamFlix Mobile v1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Video Engine</Text>
          <Text style={styles.infoValue}>Google ExoPlayer (expo-av)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Backend API</Text>
          <Text style={styles.infoValue}>https://mystreamflix.biz.id</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* Sign In Modal */}
      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign In to MyStreamFlix</Text>
            <Text style={styles.modalSub}>Access your synced watchlist and VIP streams</Text>

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

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogin}>
              <Text style={styles.submitBtnText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowLoginModal(false)}
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
    backgroundColor: "#00ADB5",
    paddingVertical: 10,
    paddingHorizontal: 24,
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
    marginBottom: 20,
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
