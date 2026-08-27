import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  Crown,
  ChevronLeft,
  Film,
  Radio,
  HardDrive,
  Users,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react-native";
import { Movie, User } from "../types";
import { useMovies } from "../context/MovieContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useModernDialog } from "../context/ModernDialogContext";
import { fetchDatabaseUsers, deleteMovieById, createMovieOrChannel } from "../api/client";

interface AdminScreenProps {
  onBack: () => void;
}

export default function AdminScreen({ onBack }: AdminScreenProps) {
  const { isAdmin } = useAuth();
  const { movies, refresh } = useMovies();
  const { t } = useLanguage();
  const { showDeleteConfirm, showSuccess, showError } = useModernDialog();

  const [activeTab, setActiveTab] = useState<"catalog" | "livetv" | "gdrive" | "users">("catalog");
  const [searchCatalog, setSearchCatalog] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New Content Form Modal / Inputs
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newPosterUrl, setNewPosterUrl] = useState("");
  const [newCategory, setNewCategory] = useState("Action");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const data = await fetchDatabaseUsers();
    setUsers(data);
    setLoadingUsers(false);
  };

  // ⛔ Auth Guard
  if (!isAdmin) {
    return (
      <View style={styles.deniedContainer}>
        <View style={styles.deniedIcon}>
          <ShieldCheck size={36} color="#FF4444" />
        </View>
        <Text style={styles.deniedTitle}>Akses Ditolak</Text>
        <Text style={styles.deniedSub}>Halaman ini hanya dapat diakses oleh akun Administrator Database.</Text>
        <TouchableOpacity style={styles.backActionBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.backActionText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catalogItems = movies.filter(
    (m) =>
      m.contentType !== "livetv" &&
      !m.id.startsWith("tv-") &&
      m.title.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  const liveTvItems = movies.filter(
    (m) =>
      (m.contentType === "livetv" || m.id.startsWith("tv-")) &&
      m.title.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  const handleDeleteItem = (item: Movie) => {
    showDeleteConfirm(
      "Hapus Konten",
      `Apakah Anda yakin ingin menghapus "${item.title}" dari database?`,
      async () => {
        const res = await deleteMovieById(item.id);
        if (res.success) {
          await refresh();
          showSuccess("Terhapus", `"${item.title}" telah dihapus.`);
        } else {
          showError("Gagal", res.error || "Tidak dapat menghapus konten.");
        }
      }
    );
  };

  const handleCreateContent = async () => {
    if (!newTitle.trim() || !newVideoUrl.trim()) {
      showError("Input Wajib", "Judul dan URL video/stream wajib diisi.");
      return;
    }

    setSaving(true);
    const res = await createMovieOrChannel({
      id: activeTab === "livetv" ? `tv-${Date.now()}` : `mov-${Date.now()}`,
      title: newTitle.trim(),
      videoUrl: newVideoUrl.trim(),
      posterUrl: newPosterUrl.trim() || "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500",
      backdropUrl: newPosterUrl.trim() || "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500",
      description: `Konten ${newTitle} ditambahkan via Master CMS.`,
      releaseYear: 2025,
      year: 2025,
      rating: 8.5,
      quality: "1080p FHD",
      genres: [newCategory],
      contentType: activeTab === "livetv" ? "livetv" : "movie",
    });
    setSaving(false);

    if (res.success) {
      setShowAddForm(false);
      setNewTitle("");
      setNewVideoUrl("");
      setNewPosterUrl("");
      await refresh();
      showSuccess("Sukses", `"${newTitle}" berhasil ditambahkan ke database!`);
    } else {
      showError("Gagal Menyimpan", res.error || "Gagal menyimpan konten ke server.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <ChevronLeft size={22} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={styles.crownBadge}>
            <Crown size={11} color="#FFD700" />
            <Text style={styles.crownText}>MASTER CMS</Text>
          </View>
          <Text style={styles.headerTitle}>Database Administrator</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={refresh} activeOpacity={0.8}>
          <RefreshCw size={16} color="#00ADB5" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "catalog" && styles.tabBtnActive]}
          onPress={() => setActiveTab("catalog")}
          activeOpacity={0.8}
        >
          <Film size={14} color={activeTab === "catalog" ? "#000" : "#888"} />
          <Text style={[styles.tabBtnText, activeTab === "catalog" && styles.tabBtnTextActive]}>
            Katalog ({catalogItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "livetv" && styles.tabBtnActive]}
          onPress={() => setActiveTab("livetv")}
          activeOpacity={0.8}
        >
          <Radio size={14} color={activeTab === "livetv" ? "#000" : "#888"} />
          <Text style={[styles.tabBtnText, activeTab === "livetv" && styles.tabBtnTextActive]}>
            Live TV ({liveTvItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "users" && styles.tabBtnActive]}
          onPress={() => setActiveTab("users")}
          activeOpacity={0.8}
        >
          <Users size={14} color={activeTab === "users" ? "#000" : "#888"} />
          <Text style={[styles.tabBtnText, activeTab === "users" && styles.tabBtnTextActive]}>
            Pengguna ({users.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search & Add Bar */}
        <View style={styles.actionHeader}>
          <View style={styles.searchBar}>
            <Search size={15} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari konten database..."
              placeholderTextColor="#666"
              value={searchCatalog}
              onChangeText={setSearchCatalog}
            />
          </View>

          {activeTab !== "users" && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddForm(!showAddForm)}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#000" />
              <Text style={styles.addBtnText}>Tambah</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Add Form Panel */}
        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Tambah {activeTab === "livetv" ? "Saluran Live TV" : "Film Baru"}
            </Text>

            <TextInput
              style={styles.formInput}
              placeholder="Judul / Nama Saluran *"
              placeholderTextColor="#666"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.formInput}
              placeholder="URL Video (.m3u8 / .mp4 / GDrive) *"
              placeholderTextColor="#666"
              value={newVideoUrl}
              onChangeText={setNewVideoUrl}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.formInput}
              placeholder="URL Poster / Gambar (opsional)"
              placeholderTextColor="#666"
              value={newPosterUrl}
              onChangeText={setNewPosterUrl}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleCreateContent}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Simpan ke Database</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Content List */}
        {activeTab === "catalog" && (
          <View style={styles.listWrap}>
            {catalogItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemSub}>
                    {item.releaseYear || item.year || 2025} • {item.genres?.join(", ") || "General"}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteItem(item)} activeOpacity={0.8}>
                  <Trash2 size={16} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === "livetv" && (
          <View style={styles.listWrap}>
            {liveTvItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemSub}>
                    {item.genres?.join(", ") || "Nasional"} • Live Stream HLS
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteItem(item)} activeOpacity={0.8}>
                  <Trash2 size={16} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === "users" && (
          <View style={styles.listWrap}>
            {users.map((u) => (
              <View key={u.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{u.name || u.email}</Text>
                  <Text style={styles.itemSub}>{u.email} • Role: {u.role?.toUpperCase()}</Text>
                </View>
                {u.role === "admin" && (
                  <View style={styles.adminRoleTag}>
                    <Crown size={10} color="#FFD700" />
                    <Text style={styles.adminRoleTagText}>ADMIN</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0C" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 44, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: "#111118", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  headerTitleWrap: { alignItems: "center" },
  crownBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,215,0,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 2 },
  crownText: { color: "#FFD700", fontSize: 9, fontWeight: "900" },
  headerTitle: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,173,181,0.12)", justifyContent: "center", alignItems: "center" },
  tabsRow: { flexDirection: "row", backgroundColor: "#161622", padding: 4, margin: 16, borderRadius: 12 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: "#00ADB5" },
  tabBtnText: { color: "#888", fontSize: 11, fontWeight: "700" },
  tabBtnTextActive: { color: "#000", fontWeight: "900" },
  content: { flex: 1, paddingHorizontal: 16 },
  actionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#14141E", borderWidth: 1, borderColor: "#222230", borderRadius: 10, paddingHorizontal: 10, height: 40 },
  searchInput: { flex: 1, color: "#FFF", fontSize: 12, marginLeft: 6 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#00ADB5", paddingHorizontal: 14, height: 40, borderRadius: 10 },
  addBtnText: { color: "#000", fontSize: 12, fontWeight: "800" },
  formCard: { backgroundColor: "#14141E", borderWidth: 1, borderColor: "rgba(0,173,181,0.3)", borderRadius: 14, padding: 14, marginBottom: 16, gap: 10 },
  formTitle: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  formInput: { backgroundColor: "#1C1C28", borderWidth: 1, borderColor: "#2A2A38", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: "#FFF", fontSize: 12 },
  saveBtn: { backgroundColor: "#00ADB5", paddingVertical: 11, borderRadius: 10, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#000", fontSize: 13, fontWeight: "900" },
  listWrap: { gap: 8 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#14141E", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  itemInfo: { flex: 1, marginRight: 10 },
  itemTitle: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  itemSub: { color: "#777", fontSize: 11, marginTop: 2 },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,68,68,0.12)", justifyContent: "center", alignItems: "center" },
  adminRoleTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,215,0,0.15)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  adminRoleTagText: { color: "#FFD700", fontSize: 9, fontWeight: "900" },
  deniedContainer: { flex: 1, backgroundColor: "#0A0A0C", justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 12 },
  deniedIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,68,68,0.12)", borderWidth: 1, borderColor: "rgba(255,68,68,0.3)", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  deniedTitle: { color: "#FFF", fontSize: 20, fontWeight: "900" },
  deniedSub: { color: "#777", fontSize: 13, textAlign: "center", lineHeight: 18 },
  backActionBtn: { backgroundColor: "#FF4444", paddingVertical: 11, paddingHorizontal: 28, borderRadius: 20, marginTop: 8 },
  backActionText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
});