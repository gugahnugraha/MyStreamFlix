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
  Eye,
  EyeOff,
  ArrowRight,
  X,
  AlertCircle,
  ShieldAlert,
} from "lucide-react-native";
import { User, UserProfile } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useModernDialog } from "../context/ModernDialogContext";
import { useAuth } from "../context/AuthContext";
import AuthGateModal from "../components/AuthGateModal";

export default function ProfileScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { showSuccess, showError, showConfirm } = useModernDialog();
  const { currentUser, isLoggedIn, isAdmin, logout } = useAuth();

  const [activeProfileId, setActiveProfileId] = useState("prof-1");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Preference Toggles
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);

  const handleLogout = () => {
    showConfirm(
      t.signOut,
      t.confirmSignOut,
      () => {
        logout();
        showSuccess("Berhasil Keluar", "Anda telah berhasil keluar dari akun.");
      },
      t.signOut,
      t.cancel,
      true
    );
  };

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
            onPress={() => setShowAuthModal(true)}
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

      {/* Admin Panel Quick Access (Only for Admin Role) */}
      {isAdmin && (
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
      )}

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

      {/* 🔐 AUTH GATE MODAL */}
      <AuthGateModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
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
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#121216",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#262632",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brandTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  brandIconMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,173,181,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
    position: "relative",
  },
  brandSparkle: {
    position: "absolute",
    top: 3,
    right: 3,
  },
  brandNameText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  brandTaglineText: {
    color: "#888",
    fontSize: 10,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1C1C24",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E2E3A",
  },
  authTabSegment: {
    flexDirection: "row",
    backgroundColor: "#0B0B0E",
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1E1E26",
  },
  authTabPill: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  authTabPillActive: {
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
  quickChipsSection: {
    marginBottom: 12,
    backgroundColor: "#0C0C10",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1C1C24",
  },
  quickChipsLabel: {
    color: "#777",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickChipAdmin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(251,191,36,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
  },
  quickChipAdminText: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "bold",
  },
  quickChipUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,173,181,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  quickChipUserText: {
    color: "#00ADB5",
    fontSize: 10,
    fontWeight: "bold",
  },
  authErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(229,9,20,0.12)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(229,9,20,0.3)",
    marginBottom: 12,
  },
  authErrorText: {
    color: "#E50914",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  modernInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16161C",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#22222C",
    gap: 10,
    height: 46,
  },
  modernInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
    paddingVertical: 0,
  },
  eyeToggleBtn: {
    padding: 4,
  },
  primaryAuthSubmitBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#00ADB5",
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 12,
    shadowColor: "#00ADB5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryAuthSubmitText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  authSecurityFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  authSecurityText: {
    color: "#666",
    fontSize: 10,
    textAlign: "center",
  },
});
