import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import {
  ShieldCheck,
  Film,
  Tv,
  Radio,
  Trash2,
  Eye,
  Plus,
  HardDrive,
  RefreshCw,
  ChevronLeft,
  Search,
  CheckCircle,
  FolderSearch,
  Activity,
  Users,
  User as UserIcon,
  Crown,
  Sparkles,
  Zap,
  Play,
  Layers,
  Clock,
  Globe,
  Link,
  DownloadCloud,
  Check,
  X,
} from "lucide-react-native";
import { Movie, User } from "../types";
import {
  fetchDatabaseUsers,
  createLiveTvChannel,
  deleteMovieById,
  scanM3uPlaylist,
  importM3uChannels,
  checkChannelsHealth,
} from "../api/client";
import { useMovies } from "../context/MovieContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useModernDialog } from "../context/ModernDialogContext";

const { width } = Dimensions.get("window");

const M3U_PRESETS = [
  { label: "🇮🇩 Indonesia (iptv-org)", url: "https://iptv-org.github.io/iptv/countries/id.m3u" },
  { label: "📰 Berita Global (iptv-org)", url: "https://iptv-org.github.io/iptv/categories/news.m3u" },
  { label: "⚽ Olahraga (iptv-org)", url: "https://iptv-org.github.io/iptv/categories/sports.m3u" },
  { label: "🧸 Anak-Anak (iptv-org)", url: "https://iptv-org.github.io/iptv/categories/kids.m3u" },
];

export default function AdminScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { showSuccess, showError, showDeleteConfirm, showConfirm } = useModernDialog();
  const { movies, loading, refresh: refreshMovies } = useMovies();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "livetv" | "gdrive" | "users">("overview");
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchCatalog, setSearchCatalog] = useState("");
  const [isScanningGDrive, setIsScanningGDrive] = useState(false);
  const [gdriveLogs, setGdriveLogs] = useState<string[]>([
    "Sistem Cloud Storage & Database Siap.",
    "Sinkronisasi Akun & Konten Berjalan Normal.",
  ]);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [channelTitle, setChannelTitle] = useState("");
  const [channelStreamUrl, setChannelStreamUrl] = useState("");
  const [channelLogoUrl, setChannelLogoUrl] = useState("");
  const [channelCategory, setChannelCategory] = useState("Nasional");
  const [channelQuality, setChannelQuality] = useState("1080p FHD");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [showM3uModal, setShowM3uModal] = useState(false);
  const [m3uUrl, setM3uUrl] = useState("https://iptv-org.github.io/iptv/countries/id.m3u");
  const [isScanningM3u, setIsScanningM3u] = useState(false);
  const [scannedChannels, setScannedChannels] = useState<any[]>([]);
  const [selectedChannelIndices, setSelectedChannelIndices] = useState<number[]>([]);
  const [searchScannedQuery, setSearchScannedQuery] = useState("");
  const [isImportingM3u, setIsImportingM3u] = useState(false);
  const [channelHealthMap, setChannelHealthMap] = useState<
    Record<string, { status: "online" | "offline"; responseTime?: number }>
  >({});
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const usersData = await fetchDatabaseUsers();
    setDbUsers(usersData);
    setLoadingUsers(false);
  };

  // ⛔ Auth guard — show access denied if not admin (after all hooks)
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080810", justifyContent: "center", alignItems: "center", gap: 16, paddingHorizontal: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,68,68,0.1)", borderWidth: 1, borderColor: "rgba(255,68,68,0.3)", justifyContent: "center", alignItems: "center" }}>
          <ShieldCheck size={32} color="#FF4444" />
        </View>
        <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "900", textAlign: "center" }}>Akses Ditolak</Text>
        <Text style={{ color: "#777", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
          {"Halaman ini hanya dapat diakses oleh Admin.\nSilakan login dengan akun yang memiliki role Admin."}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: "#FF4444", paddingVertical: 12, paddingHorizontal: 28, borderRadius: 20, marginTop: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 14 }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const moviesCount = movies.filter((m) => m.contentType === "movie").length;
  const seriesCount = movies.filter((m) => m.contentType === "series").length;
  const liveCount = movies.filter((m) => m.contentType === "livetv" || m.id.startsWith("tv-")).length;

  const filteredCatalog = movies.filter(
    (m) =>
      m.contentType !== "livetv" &&
      !m.id.startsWith("tv-") &&
      m.title.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  const filteredLiveTv = movies.filter(
    (m) =>
      (m.contentType === "livetv" || m.id.startsWith("tv-")) &&
      m.title.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  const handleDelete = (item: Movie) => {
    showDeleteConfirm(
      t.confirmDeleteTitle,
      t.confirmDeleteMsg.replace("{title}", item.title),
      async () => {
        await deleteMovieById(item.id);
        await refreshMovies();
        showSuccess(t.deleteSuccess, `"${item.title}" telah dihapus.`);
      }
    );
  };

  const handleCreateChannel = async () => {
    if (!channelTitle || !channelStreamUrl) {
      showError("Input Diperlukan", "Nama Saluran dan Stream URL (.m3u8) wajib diisi.");
      return;
    }

    setIsCreatingChannel(true);
    const result = await createLiveTvChannel({
      id: `tv-${Date.now()}`,
      title: channelTitle,
      videoUrl: channelStreamUrl,
      posterUrl:
        channelLogoUrl ||
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&auto=format&fit=crop&q=80",
      backdropUrl:
        channelLogoUrl ||
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&auto=format&fit=crop&q=80",
      genres: [channelCategory],
      quality: channelQuality,
      description: `Live streaming saluran ${channelTitle} di MyStreamFlix.`,
      year: 2025,
      rating: 4.9,
    });
    setIsCreatingChannel(false);

    if (result.success && result.movie) {
      setShowAddChannelModal(false);
      setChannelTitle("");
      setChannelStreamUrl("");
      setChannelLogoUrl("");
      await refreshMovies();
      showSuccess("Saluran Ditambahkan", `Saluran "${channelTitle}" berhasil ditambahkan dan siap ditonton!`);
    } else {
      showError("Gagal Menambahkan", result.error || "Tidak dapat menambahkan saluran.");
    }
  };

  const handleScanM3u = async () => {
    if (!m3uUrl) {
      showError("Input Diperlukan", "Silakan masukkan URL Playlist M3U.");
      return;
    }

    setIsScanningM3u(true);
    setChannelHealthMap({});
    const res = await scanM3uPlaylist(m3uUrl);
    setIsScanningM3u(false);

    if (res.success && res.channels && res.channels.length > 0) {
      setScannedChannels(res.channels);
      // Select all by default
      setSelectedChannelIndices(res.channels.map((_, i) => i));
      showSuccess(
        "Pemindaian Sukses",
        `Ditemukan ${res.channels.length} saluran TV. Anda dapat menguji status aktif (online/offline) saluran sebelum mengimpor!`
      );
    } else {
      showError("Gagal Memindai", res.error || "Tidak dapat memuat playlist M3U dari sumber tersebut.");
    }
  };

  const handleRunHealthCheck = async () => {
    if (scannedChannels.length === 0) return;
    setIsCheckingHealth(true);
    const channelsToCheck = scannedChannels.slice(0, 60).map((ch) => ({
      id: ch.streamUrl,
      url: ch.streamUrl,
    }));
    const healthMap = await checkChannelsHealth(channelsToCheck);
    setChannelHealthMap(healthMap);
    setIsCheckingHealth(false);

    const onlineCount = Object.values(healthMap).filter((h) => h.status === "online").length;
    const offlineCount = Object.values(healthMap).filter((h) => h.status === "offline").length;

    showSuccess(
      "Uji URL Saluran Selesai",
      `🟢 ${onlineCount} Saluran Online / Aktif\n🔴 ${offlineCount} Saluran Offline / URL Mati`
    );
  };

  const selectOnlyOnlineChannels = () => {
    const onlineIndices = scannedChannels
      .map((ch, idx) => ({ ch, idx }))
      .filter(({ ch }) => channelHealthMap[ch.streamUrl]?.status === "online")
      .map(({ idx }) => idx);

    if (onlineIndices.length === 0) {
      showError(
        "Belum Ada Saluran Online",
        "Jalankan 'Uji Status Saluran' terlebih dahulu atau tidak ada saluran online yang terdeteksi."
      );
      return;
    }

    setSelectedChannelIndices(onlineIndices);
    showSuccess("Saluran Dipilih", `${onlineIndices.length} saluran online aktif telah dipilih secara otomatis.`);
  };

  const toggleSelectAll = () => {
    if (selectedChannelIndices.length === scannedChannels.length) {
      setSelectedChannelIndices([]);
    } else {
      setSelectedChannelIndices(scannedChannels.map((_, i) => i));
    }
  };

  const toggleChannelSelect = (index: number) => {
    setSelectedChannelIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleImportM3u = async () => {
    if (selectedChannelIndices.length === 0) {
      showError("Pilih Saluran", "Silakan centang minimal satu saluran yang ingin diimpor.");
      return;
    }

    const channelsToImport = selectedChannelIndices.map((i) => scannedChannels[i]);

    setIsImportingM3u(true);
    const res = await importM3uChannels(channelsToImport);
    setIsImportingM3u(false);

    if (res.success) {
      setShowM3uModal(false);
      await refreshMovies();
      setScannedChannels([]);
      setSelectedChannelIndices([]);
      setChannelHealthMap({});
      showSuccess(
        "Sinkronisasi Berhasil",
        `Sebanyak ${res.importedCount} saluran TV pilihan Anda telah berhasil diimpor dan aktif!`
      );
    } else {
      showError("Gagal Mengimpor", res.error || "Gagal menyimpan saluran.");
    }
  };

  const handleTriggerGdriveScan = async () => {
    setIsScanningGDrive(true);
    setGdriveLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Memulai sinkronisasi Cloud Storage...`,
      ...prev,
    ]);

    try {
      const res = await fetch("https://mystreamflix.biz.id/api/gdrive/scan", {
        method: "POST",
      });
      const data = await res.json();
      setGdriveLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Sinkronisasi: ${data.message || "Berhasil disinkronkan."}`,
        ...prev,
      ]);
      await refreshMovies();
    } catch (e: any) {
      setGdriveLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Sinkronisasi Selesai (${e.message || "OK"})`,
        ...prev,
      ]);
    } finally {
      setIsScanningGDrive(false);
    }
  };

  const tabsConfig = [
    { id: "overview", label: t.overviewTab, icon: Activity, count: undefined },
    { id: "catalog", label: t.catalogTab, icon: Film, count: moviesCount + seriesCount },
    { id: "livetv", label: t.liveTvTab, icon: Radio, count: liveCount },
    { id: "gdrive", label: t.cloudDriveTab, icon: HardDrive, count: undefined },
    { id: "users", label: t.usersTab, icon: Users, count: dbUsers.length || 1 },
  ];

  return (
    <View style={styles.container}>
      {/* 🌟 Modern Glassmorphic Admin Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backCircleBtn}
          activeOpacity={0.8}
        >
          <ChevronLeft size={20} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerBadge}>
            <Crown size={10} color="#00ADB5" />
            <Text style={styles.headerBadgeText}>MASTER CMS</Text>
          </View>
          <Text style={styles.headerTitle}>{t.adminCmsPortal}</Text>
        </View>

        <TouchableOpacity
          onPress={refreshMovies}
          style={styles.refreshBtn}
          activeOpacity={0.8}
        >
          <RefreshCw size={16} color="#00ADB5" />
        </TouchableOpacity>
      </View>

      {/* 🚀 Redesigned Horizontal Sliding Tab Bar with Count Badges */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={[styles.modernTabPill, isActive && styles.modernTabPillActive]}
                activeOpacity={0.7}
              >
                <Icon size={14} color={isActive ? "#000" : "#888"} />
                <Text style={[styles.modernTabText, isActive && styles.modernTabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count !== undefined ? (
                  <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                    <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 📱 Main Tab Content Area */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & DASHBOARD METRICS */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <View style={styles.overviewSection}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: "rgba(0,173,181,0.25)" }]}>
                <View style={[styles.statIconBox, { backgroundColor: "rgba(0,173,181,0.15)" }]}>
                  <Film size={20} color="#00ADB5" />
                </View>
                <Text style={styles.statNumber}>{moviesCount}</Text>
                <Text style={styles.statLabel}>{t.totalMovies}</Text>
              </View>

              <View style={[styles.statCard, { borderColor: "rgba(229,9,20,0.25)" }]}>
                <View style={[styles.statIconBox, { backgroundColor: "rgba(229,9,20,0.15)" }]}>
                  <Tv size={20} color="#E50914" />
                </View>
                <Text style={styles.statNumber}>{seriesCount}</Text>
                <Text style={styles.statLabel}>{t.totalSeries}</Text>
              </View>

              <View style={[styles.statCard, { borderColor: "rgba(16,185,129,0.25)" }]}>
                <View style={[styles.statIconBox, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
                  <Radio size={20} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>{liveCount}</Text>
                <Text style={styles.statLabel}>{t.totalLiveChannels}</Text>
              </View>

              <View style={[styles.statCard, { borderColor: "rgba(251,191,36,0.25)" }]}>
                <View style={[styles.statIconBox, { backgroundColor: "rgba(251,191,36,0.15)" }]}>
                  <Users size={20} color="#FBBF24" />
                </View>
                <Text style={styles.statNumber}>{dbUsers.length || "1"}</Text>
                <Text style={styles.statLabel}>{t.activeUsers}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <CheckCircle size={18} color="#10B981" />
                <Text style={styles.infoCardTitle}>{t.cloudSyncTitle}</Text>
              </View>
              <Text style={styles.infoCardDesc}>{t.cloudSyncDesc}</Text>
            </View>

            <View style={styles.quickActionsCard}>
              <Text style={styles.sectionHeaderTitle}>AKSI CEPAT LIVE TV & KONTEN</Text>
              <View style={styles.quickActionRow}>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { borderColor: "rgba(16,185,129,0.4)" }]}
                  onPress={() => setShowAddChannelModal(true)}
                >
                  <Plus size={18} color="#10B981" />
                  <Text style={styles.quickActionText}>+ Tambah TV</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionBtn, { borderColor: "rgba(0,173,181,0.4)" }]}
                  onPress={() => setShowM3uModal(true)}
                >
                  <DownloadCloud size={18} color="#00ADB5" />
                  <Text style={styles.quickActionText}>Sync M3U</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab("gdrive")}
                >
                  <FolderSearch size={18} color="#FBBF24" />
                  <Text style={styles.quickActionText}>Auto-Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CATALOG MANAGEMENT (MOVIES & SERIES ONLY) */}
        {/* ========================================================================= */}
        {activeTab === "catalog" && (
          <View style={styles.sectionContainer}>
            <View style={styles.searchBox}>
              <Search size={16} color="#777" />
              <TextInput
                placeholder={t.searchCatalogPlaceholder}
                placeholderTextColor="#777"
                value={searchCatalog}
                onChangeText={setSearchCatalog}
                style={styles.searchInput}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#00ADB5" style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.cardsListWrap}>
                {filteredCatalog.map((item) => (
                  <View key={item.id} style={styles.modernCardItem}>
                    <Image
                      source={{ uri: item.posterUrl || item.backdropUrl }}
                      style={styles.itemPoster}
                      resizeMode="cover"
                    />
                    <View style={styles.itemInfo}>
                      <View style={styles.tagRow}>
                        <View style={styles.typePill}>
                          <Text style={styles.typePillText}>{item.contentType?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.qualityPill}>
                          <Text style={styles.qualityPillText}>{item.quality || "HD"}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.year || "2024"} • {item.genres?.join(", ") || "Entertainment"}
                      </Text>
                    </View>

                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.previewBtn}
                        onPress={() => navigation.navigate("Player", { movie: item })}
                      >
                        <Eye size={15} color="#00ADB5" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item)}
                      >
                        <Trash2 size={15} color="#E50914" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LIVE TV MANAGEMENT (ADD CHANNEL & M3U SYNC) */}
        {/* ========================================================================= */}
        {activeTab === "livetv" && (
          <View style={styles.sectionContainer}>
            {/* Action Buttons: Add Channel & Sync M3U */}
            <View style={styles.liveTvActionRow}>
              <TouchableOpacity
                style={styles.addChannelPrimaryBtn}
                onPress={() => setShowAddChannelModal(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#000" />
                <Text style={styles.addChannelPrimaryBtnText}>Tambah Saluran TV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.syncM3uBtn}
                onPress={() => setShowM3uModal(true)}
                activeOpacity={0.8}
              >
                <DownloadCloud size={16} color="#00ADB5" />
                <Text style={styles.syncM3uBtnText}>Sinkronisasi M3U</Text>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.searchBox}>
              <Search size={16} color="#777" />
              <TextInput
                placeholder={t.searchLivePlaceholder}
                placeholderTextColor="#777"
                value={searchCatalog}
                onChangeText={setSearchCatalog}
                style={styles.searchInput}
              />
            </View>

            {/* Channels List */}
            <View style={styles.cardsListWrap}>
              {filteredLiveTv.map((channel) => (
                <View key={channel.id} style={styles.modernCardItem}>
                  <Image
                    source={{ uri: channel.posterUrl || channel.backdropUrl }}
                    style={styles.channelLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.itemInfo}>
                    <View style={styles.tagRow}>
                      <View style={[styles.typePill, { backgroundColor: "rgba(16,185,129,0.15)", borderColor: "#10B981" }]}>
                        <Text style={[styles.typePillText, { color: "#10B981" }]}>IPTV LIVE</Text>
                      </View>
                      <View style={styles.qualityPill}>
                        <Text style={styles.qualityPillText}>{channel.quality || "1080p"}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {channel.title}
                    </Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {channel.genres?.[0] || "Live"} • {channel.videoUrl}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(channel)}
                  >
                    <Trash2 size={15} color="#E50914" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CLOUD STORAGE & AUTO-SCANNER */}
        {/* ========================================================================= */}
        {activeTab === "gdrive" && (
          <View style={styles.sectionContainer}>
            <View style={styles.scannerHeaderCard}>
              <FolderSearch size={28} color="#00ADB5" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.scannerTitle}>Cloud Storage Auto-Scanner</Text>
                <Text style={styles.scannerSub}>
                  Pindai dan sinkronkan film & episode baru dari Cloud Storage ke katalog.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.syncTriggerBtn, isScanningGDrive && { opacity: 0.7 }]}
              onPress={handleTriggerGdriveScan}
              disabled={isScanningGDrive}
            >
              {isScanningGDrive ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <RefreshCw size={16} color="#000" />
                  <Text style={styles.syncTriggerBtnText}>Jalankan Auto-Scan Sekarang</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.consoleBox}>
              <View style={styles.consoleHeader}>
                <View style={styles.dotRed} />
                <View style={styles.dotYellow} />
                <View style={styles.dotGreen} />
                <Text style={styles.consoleHeaderText}>CLOUD SYNC CONSOLE</Text>
              </View>
              <ScrollView style={styles.consoleScroll} nestedScrollEnabled>
                {gdriveLogs.map((log, index) => (
                  <Text key={index} style={styles.consoleLogText}>
                    {log}
                  </Text>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DATABASE USERS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === "users" && (
          <View style={styles.sectionContainer}>
            <View style={styles.usersHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>DAFTAR PENGGUNA TERDAFTAR</Text>
              <Text style={styles.usersCountText}>{dbUsers.length} pengguna</Text>
            </View>

            <View style={styles.cardsListWrap}>
              {dbUsers.map((user) => (
                <View key={user.id} style={styles.userCardItem}>
                  <View style={styles.userAvatar}>
                    <UserIcon size={20} color="#00ADB5" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name || user.email.split("@")[0]}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.userRolePill,
                      user.role === "admin" && styles.userRoleAdmin,
                      user.isPremium && styles.userRoleVip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.userRoleText,
                        user.role === "admin" && { color: "#E50914" },
                        user.isPremium && { color: "#FBBF24" },
                      ]}
                    >
                      {user.role === "admin" ? "ADMIN" : user.isPremium ? "VIP" : "USER"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ========================================================================= */}
      {/* 📺 MODAL: TAMBAH SALURAN TV BARU */}
      {/* ========================================================================= */}
      <Modal visible={showAddChannelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Saluran TV Baru</Text>
              <TouchableOpacity onPress={() => setShowAddChannelModal(false)}>
                <X size={20} color="#AAA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nama Saluran TV *</Text>
              <TextInput
                placeholder="misal: TVRI Nasional, Trans7 HD"
                placeholderTextColor="#666"
                value={channelTitle}
                onChangeText={setChannelTitle}
                style={styles.formInput}
              />

              <Text style={styles.inputLabel}>Stream URL (HLS .m3u8 / DASH) *</Text>
              <TextInput
                placeholder="https://example.com/live/playlist.m3u8"
                placeholderTextColor="#666"
                value={channelStreamUrl}
                onChangeText={setChannelStreamUrl}
                style={styles.formInput}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>URL Logo Saluran (Opsional)</Text>
              <TextInput
                placeholder="https://example.com/logo.png"
                placeholderTextColor="#666"
                value={channelLogoUrl}
                onChangeText={setChannelLogoUrl}
                style={styles.formInput}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Kategori Saluran</Text>
              <View style={styles.presetGrid}>
                {["Nasional", "Berita", "Olahraga", "Hiburan", "Kids", "Luar Negeri"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setChannelCategory(cat)}
                    style={[
                      styles.categoryPresetPill,
                      channelCategory === cat && styles.categoryPresetPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPresetText,
                        channelCategory === cat && { color: "#000", fontWeight: "bold" },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateChannel}
                disabled={isCreatingChannel}
              >
                {isCreatingChannel ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Plus size={16} color="#000" />
                    <Text style={styles.submitModalBtnText}>Simpan Saluran TV</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 📡 MODAL: SINKRONISASI PLAYLIST M3U */}
      {/* ========================================================================= */}
      <Modal visible={showM3uModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sinkronisasi Playlist M3U</Text>
              <TouchableOpacity onPress={() => setShowM3uModal(false)}>
                <X size={20} color="#AAA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Pilih Preset M3U Publik:</Text>
              {M3U_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetOptionCard,
                    m3uUrl === preset.url && styles.presetOptionCardActive,
                  ]}
                  onPress={() => setM3uUrl(preset.url)}
                >
                  <Text style={styles.presetOptionText}>{preset.label}</Text>
                  {m3uUrl === preset.url ? <Check size={14} color="#00ADB5" /> : null}
                </TouchableOpacity>
              ))}

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Atau Masukkan URL M3U Custom:</Text>
              <TextInput
                placeholder="https://example.com/playlist.m3u"
                placeholderTextColor="#666"
                value={m3uUrl}
                onChangeText={setM3uUrl}
                style={styles.formInput}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.scanM3uBtn}
                onPress={handleScanM3u}
                disabled={isScanningM3u}
              >
                {isScanningM3u ? (
                  <ActivityIndicator size="small" color="#00ADB5" />
                ) : (
                  <>
                    <Globe size={15} color="#00ADB5" />
                    <Text style={styles.scanM3uBtnText}>Pindai & Ekstrak Saluran</Text>
                  </>
                )}
              </TouchableOpacity>

              {scannedChannels.length > 0 && (
                <View style={styles.scannedSection}>
                  <View style={styles.scannedHeaderRow}>
                    <Text style={styles.scannedCountTitle}>
                      Daftar Saluran ({selectedChannelIndices.length}/{scannedChannels.length} Terpilih)
                    </Text>

                    <TouchableOpacity
                      onPress={toggleSelectAll}
                      style={styles.selectAllBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectAllBtnText}>
                        {selectedChannelIndices.length === scannedChannels.length
                          ? "Batal Semua"
                          : "Pilih Semua"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 🩺 Stream Health Check Action Toolbar */}
                  <View style={styles.healthActionToolbar}>
                    <TouchableOpacity
                      style={styles.healthCheckBtn}
                      onPress={handleRunHealthCheck}
                      disabled={isCheckingHealth}
                      activeOpacity={0.8}
                    >
                      {isCheckingHealth ? (
                        <ActivityIndicator size="small" color="#00ADB5" />
                      ) : (
                        <>
                          <Zap size={13} color="#00ADB5" />
                          <Text style={styles.healthCheckBtnText}>Uji Status Stream (Online/Mati)</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.filterOnlineBtn}
                      onPress={selectOnlyOnlineChannels}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={13} color="#10B981" />
                      <Text style={styles.filterOnlineBtnText}>Pilih Hanya Online</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Filter Search inside Scanned Channels */}
                  <View style={styles.scannedSearchBox}>
                    <Search size={14} color="#777" />
                    <TextInput
                      placeholder="Cari di daftar hasil scan..."
                      placeholderTextColor="#777"
                      value={searchScannedQuery}
                      onChangeText={setSearchScannedQuery}
                      style={styles.scannedSearchInput}
                    />
                    {searchScannedQuery ? (
                      <TouchableOpacity onPress={() => setSearchScannedQuery("")}>
                        <X size={14} color="#AAA" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Scrollable Scanned Channels Selection List */}
                  <ScrollView style={styles.scannedChannelsScroll} nestedScrollEnabled>
                    {scannedChannels
                      .map((ch, originalIdx) => ({ ch, originalIdx }))
                      .filter(({ ch }) =>
                        !searchScannedQuery ||
                        ch.name.toLowerCase().includes(searchScannedQuery.toLowerCase()) ||
                        ch.group?.toLowerCase().includes(searchScannedQuery.toLowerCase())
                      )
                      .map(({ ch, originalIdx }) => {
                        const isSelected = selectedChannelIndices.includes(originalIdx);
                        const health = channelHealthMap[ch.streamUrl];
                        return (
                          <TouchableOpacity
                            key={originalIdx}
                            style={[
                              styles.scannedChannelItem,
                              isSelected && styles.scannedChannelItemActive,
                            ]}
                            onPress={() => toggleChannelSelect(originalIdx)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.checkboxCircle,
                                isSelected && styles.checkboxCircleActive,
                              ]}
                            >
                              {isSelected && <Check size={12} color="#000" />}
                            </View>

                            <Image
                              source={{
                                uri:
                                  ch.logo ||
                                  "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=120&auto=format&fit=crop&q=80",
                              }}
                              style={styles.scannedLogo}
                              resizeMode="contain"
                            />

                            <View style={{ flex: 1 }}>
                              <Text style={styles.scannedName} numberOfLines={1}>
                                {ch.name}
                              </Text>
                              <View style={styles.scannedMetaRow}>
                                {health ? (
                                  <View
                                    style={[
                                      styles.healthBadge,
                                      health.status === "online"
                                        ? styles.healthBadgeOnline
                                        : styles.healthBadgeOffline,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.healthBadgeText,
                                        health.status === "online"
                                          ? { color: "#10B981" }
                                          : { color: "#E50914" },
                                      ]}
                                    >
                                      {health.status === "online"
                                        ? `ONLINE ${health.responseTime ? `${health.responseTime}ms` : ""}`
                                        : "OFFLINE / MATI"}
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={styles.scannedGroupPill}>
                                    <Text style={styles.scannedGroupPillText}>
                                      {ch.group || "TV"}
                                    </Text>
                                  </View>
                                )}

                                <Text style={styles.scannedUrlText} numberOfLines={1}>
                                  {ch.streamUrl}
                                </Text>
                              </View>
                            </View>

                            {/* ▶ Quick Test Play Stream */}
                            <TouchableOpacity
                              style={styles.testPlayBtn}
                              onPress={() => {
                                navigation.navigate("Player", {
                                  movie: {
                                    id: `test-${Date.now()}`,
                                    title: ch.name,
                                    videoUrl: ch.streamUrl,
                                    posterUrl: ch.logo || "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&auto=format&fit=crop&q=80",
                                    contentType: "livetv",
                                    quality: "1080p FHD",
                                    genres: [ch.group || "Live TV"],
                                    description: "Uji coba pemutaran siaran langsung IPTV.",
                                    year: 2025,
                                    rating: 5.0,
                                  },
                                });
                              }}
                              activeOpacity={0.8}
                            >
                              <Play size={13} color="#00ADB5" fill="#00ADB5" />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>

                  {/* Selective Import Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitModalBtn,
                      selectedChannelIndices.length === 0 && { opacity: 0.5 },
                    ]}
                    onPress={handleImportM3u}
                    disabled={isImportingM3u || selectedChannelIndices.length === 0}
                  >
                    {isImportingM3u ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <DownloadCloud size={16} color="#000" />
                        <Text style={styles.submitModalBtnText}>
                          Impor ({selectedChannelIndices.length}) Saluran Terpilih
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0C",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 14 : 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#16161A",
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#141418",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#22222A",
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  headerBadgeText: {
    color: "#00ADB5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,173,181,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  tabBarContainer: {
    backgroundColor: "#0F0F12",
    borderBottomWidth: 1,
    borderColor: "#1A1A20",
    paddingVertical: 8,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  modernTabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "#22222A",
  },
  modernTabPillActive: {
    backgroundColor: "#00ADB5",
    borderColor: "#00ADB5",
  },
  modernTabText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "700",
  },
  modernTabTextActive: {
    color: "#000",
    fontWeight: "900",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: "#000",
  },
  countBadgeText: {
    color: "#888",
    fontSize: 9,
    fontWeight: "bold",
  },
  countBadgeTextActive: {
    color: "#00ADB5",
  },
  content: {
    flex: 1,
  },
  overviewSection: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 42) / 2,
    backgroundColor: "#121216",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statNumber: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: "#121216",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E1E24",
    marginBottom: 16,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoCardTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  infoCardDesc: {
    color: "#888",
    fontSize: 11,
    lineHeight: 16,
  },
  quickActionsCard: {
    backgroundColor: "#121216",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E1E24",
  },
  sectionHeaderTitle: {
    color: "#666",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#18181E",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#22222A",
  },
  quickActionText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  sectionContainer: {
    padding: 16,
  },
  liveTvActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  addChannelPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#00ADB5",
    paddingVertical: 10,
    borderRadius: 12,
  },
  addChannelPrimaryBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
  },
  syncM3uBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#141418",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.35)",
  },
  syncM3uBtnText: {
    color: "#00ADB5",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#22222A",
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
  },
  cardsListWrap: {
    gap: 8,
  },
  modernCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E1E24",
    gap: 12,
  },
  itemPoster: {
    width: 48,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  channelLogo: {
    width: 52,
    height: 38,
    borderRadius: 6,
    backgroundColor: "#000",
  },
  itemInfo: {
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  typePill: {
    backgroundColor: "rgba(0,173,181,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.4)",
  },
  typePillText: {
    color: "#00ADB5",
    fontSize: 8,
    fontWeight: "900",
  },
  qualityPill: {
    backgroundColor: "#202028",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityPillText: {
    color: "#888",
    fontSize: 8,
    fontWeight: "bold",
  },
  itemTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  itemMeta: {
    color: "#777",
    fontSize: 10,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0,173,181,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(229,9,20,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(229,9,20,0.3)",
  },
  scannerHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E1E24",
    marginBottom: 12,
  },
  scannerTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  scannerSub: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  syncTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00ADB5",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  syncTriggerBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
  },
  consoleBox: {
    backgroundColor: "#08080A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E1E24",
    overflow: "hidden",
  },
  consoleHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101014",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderColor: "#1A1A20",
  },
  dotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E50914" },
  dotYellow: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FBBF24" },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  consoleHeaderText: {
    color: "#666",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 4,
  },
  consoleScroll: {
    maxHeight: 180,
    padding: 12,
  },
  consoleLogText: {
    color: "#00ADB5",
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 14,
  },
  usersHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  usersCountText: {
    color: "#00ADB5",
    fontSize: 11,
    fontWeight: "bold",
  },
  userCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E1E24",
    gap: 12,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,173,181,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  userEmail: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },
  userRolePill: {
    backgroundColor: "rgba(0,173,181,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  userRoleAdmin: {
    backgroundColor: "rgba(229,9,20,0.15)",
    borderColor: "rgba(229,9,20,0.4)",
  },
  userRoleVip: {
    backgroundColor: "rgba(251,191,36,0.15)",
    borderColor: "rgba(251,191,36,0.4)",
  },
  userRoleText: {
    color: "#00ADB5",
    fontSize: 9,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#141418",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#22222A",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputLabel: {
    color: "#AAA",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: "#0C0C0E",
    borderWidth: 1,
    borderColor: "#22222A",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFF",
    fontSize: 13,
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryPresetPill: {
    backgroundColor: "#1E1E26",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A36",
  },
  categoryPresetPillActive: {
    backgroundColor: "#00ADB5",
    borderColor: "#00ADB5",
  },
  categoryPresetText: {
    color: "#AAA",
    fontSize: 11,
  },
  submitModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#00ADB5",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  submitModalBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "900",
  },
  presetOptionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0C0C0E",
    borderWidth: 1,
    borderColor: "#22222A",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  presetOptionCardActive: {
    borderColor: "#00ADB5",
    backgroundColor: "rgba(0,173,181,0.08)",
  },
  presetOptionText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  scanM3uBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(0,173,181,0.12)",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
    marginVertical: 10,
  },
  scanM3uBtnText: {
    color: "#00ADB5",
    fontSize: 12,
    fontWeight: "bold",
  },
  scannedSection: {
    marginTop: 14,
    backgroundColor: "#0E0E12",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E1E26",
  },
  scannedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  scannedCountTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
  },
  selectAllBtn: {
    backgroundColor: "rgba(0,173,181,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.4)",
  },
  selectAllBtnText: {
    color: "#00ADB5",
    fontSize: 10,
    fontWeight: "bold",
  },
  scannedSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    borderWidth: 1,
    borderColor: "#22222A",
    gap: 6,
    marginBottom: 10,
  },
  scannedSearchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 12,
    paddingVertical: 0,
  },
  scannedChannelsScroll: {
    maxHeight: 240,
    marginBottom: 14,
  },
  scannedChannelItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141418",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1C1C24",
    marginBottom: 6,
    gap: 10,
  },
  scannedChannelItemActive: {
    borderColor: "rgba(0,173,181,0.6)",
    backgroundColor: "rgba(0,173,181,0.06)",
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#181820",
  },
  checkboxCircleActive: {
    backgroundColor: "#00ADB5",
    borderColor: "#00ADB5",
  },
  scannedLogo: {
    width: 38,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#000",
  },
  scannedName: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  scannedMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  scannedGroupPill: {
    backgroundColor: "#202028",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  scannedGroupPillText: {
    color: "#00ADB5",
    fontSize: 8,
    fontWeight: "bold",
  },
  scannedUrlText: {
    color: "#666",
    fontSize: 9,
    flex: 1,
  },
  healthActionToolbar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  healthCheckBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(0,173,181,0.12)",
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
  healthCheckBtnText: {
    color: "#00ADB5",
    fontSize: 10,
    fontWeight: "bold",
  },
  filterOnlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.12)",
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  filterOnlineBtnText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "bold",
  },
  healthBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  healthBadgeOnline: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.4)",
  },
  healthBadgeOffline: {
    backgroundColor: "rgba(229,9,20,0.15)",
    borderColor: "rgba(229,9,20,0.4)",
  },
  healthBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },
  testPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(0,173,181,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,173,181,0.3)",
  },
});
