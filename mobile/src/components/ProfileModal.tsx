import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { X, LogOut, Crown, User as UserIcon, Settings, Heart, History, ShieldCheck } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useModernDialog } from "../context/ModernDialogContext";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
  onOpenFavorites?: () => void;
}

export default function ProfileModal({ visible, onClose, onOpenAdmin, onOpenFavorites }: ProfileModalProps) {
  const { currentUser, isLoggedIn, isAdmin, logout } = useAuth();
  const { t } = useLanguage();
  const { showConfirm, showSuccess } = useModernDialog();

  if (!visible) return null;

  const handleSignOut = () => {
    showConfirm(
      t.signOut,
      "Apakah Anda yakin ingin keluar dari akun?",
      async () => {
        onClose();
        await logout();
        showSuccess(t.success, "Anda telah berhasil keluar dari akun.");
      },
      t.signOut,
      t.cancel
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <X size={18} color="#888" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header / Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrap}>
                {currentUser?.profileImage ? (
                  <Image source={{ uri: currentUser.profileImage }} style={styles.avatarImg} />
                ) : (
                  <UserIcon size={32} color="#00ADB5" />
                )}
                {isAdmin && (
                  <View style={styles.crownBadge}>
                    <Crown size={12} color="#000" />
                  </View>
                )}
              </View>

              <Text style={styles.userName}>{currentUser?.name || currentUser?.email?.split("@")[0] || t.guestUser}</Text>
              <Text style={styles.userEmail}>{currentUser?.email || "Pengguna Tamu"}</Text>

              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {isAdmin ? t.adminBadge : currentUser?.isPremium ? t.vipBadge : t.standardUser}
                </Text>
              </View>
            </View>

            {/* Menu List */}
            <View style={styles.menuGroup}>
              {isAdmin && onOpenAdmin && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuIcon, { backgroundColor: "rgba(255,215,0,0.15)" }]}>
                    <Crown size={16} color="#FFD700" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuTitle}>{t.adminPortal}</Text>
                    <Text style={styles.menuSub}>Kelola database, katalog & Live TV</Text>
                  </View>
                </TouchableOpacity>
              )}

              {onOpenFavorites && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onOpenFavorites();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuIcon, { backgroundColor: "rgba(255,68,68,0.15)" }]}>
                    <Heart size={16} color="#FF4444" />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuTitle}>{t.myList}</Text>
                    <Text style={styles.menuSub}>Daftar film & tontonan tersimpan</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Sign Out Button */}
            {isLoggedIn && (
              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
                <LogOut size={16} color="#FF4444" />
                <Text style={styles.signOutText}>{t.signOut}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 380, maxHeight: "80%", backgroundColor: "#111118", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "rgba(0,173,181,0.2)" },
  closeBtn: { position: "absolute", top: 14, right: 14, padding: 6, zIndex: 10 },
  avatarSection: { alignItems: "center", paddingVertical: 14 },
  avatarWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(0,173,181,0.12)", borderWidth: 2, borderColor: "#00ADB5", justifyContent: "center", alignItems: "center", position: "relative", marginBottom: 10 },
  avatarImg: { width: "100%", height: "100%", borderRadius: 34 },
  crownBadge: { position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFD700", justifyContent: "center", alignItems: "center" },
  userName: { color: "#FFF", fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
  userEmail: { color: "#777", fontSize: 12, marginTop: 2 },
  roleBadge: { backgroundColor: "rgba(0,173,181,0.12)", borderWidth: 1, borderColor: "rgba(0,173,181,0.3)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  roleBadgeText: { color: "#00ADB5", fontSize: 11, fontWeight: "800" },
  menuGroup: { marginTop: 16, gap: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#161622", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  menuIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  menuTextWrap: { flex: 1 },
  menuTitle: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  menuSub: { color: "#777", fontSize: 11, marginTop: 1 },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(255,68,68,0.1)", borderWidth: 1, borderColor: "rgba(255,68,68,0.25)", paddingVertical: 12, borderRadius: 14, marginTop: 20 },
  signOutText: { color: "#FF4444", fontSize: 13, fontWeight: "800" },
});