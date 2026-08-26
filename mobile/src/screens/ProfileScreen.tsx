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
  Image,
} from "react-native";
import {
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Lock,
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
  Check,
  RefreshCw,
  Baby,
  Smile,
} from "lucide-react-native";
import { User, UserProfile } from "../types";
import { loginUser, registerUser } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export default function ProfileScreen({ navigation }: any) {
  const { t } = useLanguage();
  // Real Database User State (default mock or live session)
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: "usr-admin-streamcms",
    name: "Gugah Nugraha",
    email: "admin@streamcms.com",
    role: "admin",
    createdAt: new Date().toISOString(),
    isPremium: true,
    profiles: [
      { id: "prof-1", name: "Gugah (Utama)", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", isKids: false },
      { id: "prof-2", name: "Kids Zone", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80", isKids: true },
    ],
    activeProfileId: "prof-1",
  });

  const [activeProfileId, setActiveProfileId] = useState("prof-1");
  const [loading, setLoading] = useState(false);

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Preference Toggles
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);

  const handleToggleRole = () => {
    if (!currentUser) return;
    const targetRole = currentUser.role === "admin" ? "user" : "admin";
    setCurrentUser({
      ...currentUser,
      role: targetRole,
    });
    Alert.alert(
      t.roleSwitched,
      targetRole === "admin" ? t.switchToAdmin : t.switchToViewer
    );
  };

  const handleAuthSubmit = async () => {
    if (!authEmail || !authPassword) {
      setAuthError("Please fill in all credentials.");
      return;
    }

    setLoading(true);

    if (authMode === "login") {
      const result = await loginUser(authEmail, authPassword);
      setLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setShowAuthModal(false);
        setAuthPassword("");
        Alert.alert("Signed In", `Welcome back, ${result.user.name || result.user.email}!`);
      } else {
        setAuthError(result.error || "Invalid email or password.");
      }
    } else {
      if (!authName) {
        setLoading(false);
        setAuthError("Please enter your name.");
        return;
      }

      const result = await registerUser(authName, authEmail, authPassword);
      setLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setShowAuthModal(false);
        setAuthPassword("");
        Alert.alert("Account Created", "Your account has been registered in the database!");
      } else {
        setAuthError(result.error || "Could not register account.");
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(t.signOut, t.confirmSignOut, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.signOut,
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
      {/* Profile Header & Info */}
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
          {currentUser ? currentUser.name || currentUser.email.split("@")[0] : t.guestUser}
        </Text>
        <Text style={styles.email}>
          {currentUser ? currentUser.email : t.notSignedIn}
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
                ? t.databaseAdmin
                : currentUser?.isPremium
                ? t.vipMember
                : currentUser
                ? t.standardUser
                : t.guestVisitor}
            </Text>
          </View>
        </View>

        {/* 🔄 Switch Role Button */}
        {currentUser ? (
          <View style={styles.topActionsRow}>
            <TouchableOpacity style={styles.toggleRoleBtn} onPress={handleToggleRole}>
              <RefreshCw size={13} color="#00ADB5" />
              <Text style={styles.toggleRoleText}>
                {isAdmin ? t.switchToViewer : t.switchToAdmin}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={13} color="#E50914" />
              <Text style={styles.logoutBtnText}>{t.signOut}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              setAuthMode("login");
              setShowAuthModal(true);
            }}
          >
            <LogIn size={15} color="#000" />
            <Text style={styles.loginBtnText}>{t.signInRegister}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🎭 Sub-Profile Switcher (Main vs Kids Zone) */}
      {currentUser?.profiles && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.switchProfile}</Text>
          <View style={styles.profileSwitcherRow}>
            {currentUser.profiles.map((p) => {
              const isSelected = activeProfileId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setActiveProfileId(p.id)}
                  style={[styles.profileCard, isSelected && styles.profileCardActive]}
                >
                  <Image source={{ uri: p.avatar }} style={styles.profileAvatar} />
                  <Text style={[styles.profileName, isSelected && { color: "#00ADB5", fontWeight: "bold" }]}>
                    {p.name}
                  </Text>
                  {p.isKids && (
                    <View style={styles.kidsBadge}>
                      <Text style={styles.kidsBadgeText}>KIDS</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Admin Panel Quick Access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.adminManagement}</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Admin")}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(0,173,181,0.15)" }]}>
              <Settings size={18} color="#00ADB5" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>{t.adminCmsPortal}</Text>
              <Text style={styles.menuItemSub}>{t.adminCmsSub}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Synced Library */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.syncedLibrary}</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Catalog")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <Bookmark size={18} color="#00ADB5" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>{t.savedWatchlist}</Text>
              <Text style={styles.menuItemSub}>{t.savedWatchlistSub}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Catalog")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconWrap}>
              <History size={18} color="#E50914" />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>{t.watchHistory}</Text>
              <Text style={styles.menuItemSub}>{t.watchHistorySub}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Playback Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.playbackPreferences}</Text>

        <View style={styles.switchItem}>
          <View>
            <Text style={styles.switchTitle}>{t.autoPlayNext}</Text>
            <Text style={styles.switchSub}>{t.autoPlayNextSub}</Text>
          </View>
          <Switch
            value={autoPlayNext}
            onValueChange={setAutoPlayNext}
            trackColor={{ false: "#333", true: "#00ADB5" }}
          />
        </View>

        <View style={styles.switchItem}>
          <View>
            <Text style={styles.switchTitle}>{t.hwAcceleration}</Text>
            <Text style={styles.switchSub}>{t.hwAccelerationSub}</Text>
          </View>
          <Switch
            value={hardwareAcceleration}
            onValueChange={setHardwareAcceleration}
            trackColor={{ false: "#333", true: "#00ADB5" }}
          />
        </View>
      </View>

      <View style={{ height: 40 }} />

      {/* Auth Modal */}
      <Modal visible={showAuthModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {authMode === "login" ? t.modalSignIn : t.modalRegister}
            </Text>
            <Text style={styles.modalSub}>
              {authMode === "login"
                ? t.modalSignInSub
                : t.modalRegisterSub}
            </Text>

            <View style={styles.authTabRow}>
              <TouchableOpacity
                onPress={() => setAuthMode("login")}
                style={[styles.authTab, authMode === "login" && styles.authTabActive]}
              >
                <Text
                  style={[
                    styles.authTabText,
                    authMode === "login" && styles.authTabTextActive,
                  ]}
                >
                  {t.modalSignIn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAuthMode("register")}
                style={[
                  styles.authTab,
                  authMode === "register" && styles.authTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.authTabText,
                    authMode === "register" && styles.authTabTextActive,
                  ]}
                >
                  {t.modalRegister}
                </Text>
              </TouchableOpacity>
            </View>

            {authError ? (
              <Text style={styles.authErrorText}>{authError}</Text>
            ) : null}

            {authMode === "register" && (
              <View style={styles.inputWrap}>
                <UserIcon size={16} color="#777" />
                <TextInput
                  placeholder={t.fullName}
                  placeholderTextColor="#777"
                  value={authName}
                  onChangeText={setAuthName}
                  style={styles.modalInput}
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <UserIcon size={16} color="#777" />
              <TextInput
                placeholder={t.emailAddress}
                placeholderTextColor="#777"
                value={authEmail}
                onChangeText={setAuthEmail}
                style={styles.modalInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Lock size={16} color="#777" />
              <TextInput
                placeholder={t.password}
                placeholderTextColor="#777"
                value={authPassword}
                onChangeText={setAuthPassword}
                secureTextEntry
                style={styles.modalInput}
              />
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleAuthSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>
                  {authMode === "login" ? t.modalSignIn : t.modalRegister}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowAuthModal(false);
                setAuthError("");
              }}
            >
              <Text style={styles.modalCancelBtnText}>{t.cancel}</Text>
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
    padding: 22,
    backgroundColor: "#121216",
    borderBottomWidth: 1,
    borderColor: "#1E1E24",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,173,181,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0,173,181,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
  },
  crownBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FACC15",
    padding: 4,
    borderRadius: 10,
  },
  name: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 2,
  },
  email: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
  },
  badgeRow: {
    marginBottom: 12,
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
    letterSpacing: 0.5,
  },
  topActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,173,181,0.12)",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  toggleRoleText: {
    color: "#00ADB5",
    fontSize: 11,
    fontWeight: "bold",
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
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: "rgba(229,9,20,0.12)",
    borderRadius: 8,
  },
  logoutBtnText: {
    color: "#E50914",
    fontSize: 11,
    fontWeight: "bold",
  },
  section: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: "#777",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
  },
  profileSwitcherRow: {
    flexDirection: "row",
    gap: 12,
  },
  profileCard: {
    flex: 1,
    backgroundColor: "#141418",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22222A",
    alignItems: "center",
  },
  profileCardActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.06)",
  },
  profileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1E1E24",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  profileName: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  adminGateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141418",
    padding: 14,
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
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(0,173,181,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  adminGateTitle: {
    color: "#FFF",
    fontSize: 13,
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
    padding: 13,
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
    padding: 13,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#141418",
    borderRadius: 20,
    padding: 22,
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
