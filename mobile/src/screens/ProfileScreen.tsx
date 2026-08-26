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
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react-native";

export default function ProfileScreen({ navigation }: any) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in email and password");
      return;
    }
    // Check if admin login
    if (email.toLowerCase().includes("admin") || password.toLowerCase() === "admin123") {
      setIsAdmin(true);
    }
    setIsLoggedIn(true);
    setShowLoginModal(false);
    Alert.alert("Success", `Welcome back, ${email}!`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setEmail("");
    setPassword("");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={36} color="#00ADB5" />
        </View>
        <Text style={styles.name}>
          {isLoggedIn ? email.split("@")[0] : "Guest User"}
        </Text>
        <Text style={styles.badge}>
          {isAdmin ? "👑 Administrator" : isLoggedIn ? "⭐ Premium Member" : "Free Explorer"}
        </Text>

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

      {/* Admin Panel Section (Visible when Admin or can toggle) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADMINISTRATION</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Admin")}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(0,173,181,0.15)" }]}>
              <ShieldCheck size={18} color="#00ADB5" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Admin CMS Dashboard</Text>
              <Text style={styles.menuItemSub}>Manage Catalog, Stats & Storage</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Account Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <Film size={18} color="#CCC" />
            </View>
            <Text style={styles.menuItemTitle}>Streaming Quality (Auto 1080p)</Text>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <Sparkles size={18} color="#CCC" />
            </View>
            <Text style={styles.menuItemTitle}>Subtitles & Captions Settings</Text>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <Settings size={18} color="#CCC" />
            </View>
            <Text style={styles.menuItemTitle}>App Version 1.0.0 (ExoPlayer)</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Login Modal Dialog */}
      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign In to MyStreamFlix</Text>
            <Text style={styles.modalSub}>Access your synced watchlist and VIP streams</Text>

            <View style={styles.inputBox}>
              <Mail size={16} color="#777" />
              <TextInput
                placeholder="Email Address (or admin@mystreamflix.com)"
                placeholderTextColor="#777"
                value={email}
                onChangeText={setEmail}
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
                value={password}
                onChangeText={setPassword}
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,173,181,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  badge: {
    color: "#00ADB5",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 14,
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
    width: 32,
    height: 32,
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
