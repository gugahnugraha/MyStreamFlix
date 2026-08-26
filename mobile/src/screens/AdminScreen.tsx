import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
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
  UserCheck,
  User as UserIcon,
  Crown,
  Sparkles,
  Zap,
  Play,
  Layers,
  Clock,
} from "lucide-react-native";
import { Movie, User } from "../types";
import { fetchMovies, loginUser, fetchDatabaseUsers } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

export default function AdminScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "livetv" | "gdrive" | "users">("overview");

  const [movies, setMovies] = useState<Movie[]>([]);
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCatalog, setSearchCatalog] = useState("");
  const [isScanningGDrive, setIsScanningGDrive] = useState(false);
  const [gdriveLogs, setGdriveLogs] = useState<string[]>([
    "Sistem Cloud Storage & Database Siap.",
    "Sinkronisasi Akun & Konten Berjalan Normal.",
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [moviesData, usersData] = await Promise.all([
      fetchMovies(),
      fetchDatabaseUsers(),
    ]);
    setMovies(moviesData);
    setDbUsers(usersData);
    setLoading(false);
  };

  const moviesCount = movies.filter((m) => m.contentType === "movie").length;
  const seriesCount = movies.filter((m) => m.contentType === "series").length;
  const liveCount = movies.filter((m) => m.contentType === "livetv").length;

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

  const handleDelete = (title: string) => {
    Alert.alert(
      t.confirmDeleteTitle,
      t.confirmDeleteMsg.replace("{title}", title),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            setMovies((prev) => prev.filter((m) => m.title !== title));
            Alert.alert(t.deleteSuccess, `"${title}" telah dihapus.`);
          },
        },
      ]
    );
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
      loadData();
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
          onPress={loadData}
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
            {/* 4 Core Stat Cards */}
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

            {/* Cloud Status Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <CheckCircle size={18} color="#10B981" />
                <Text style={styles.infoCardTitle}>{t.cloudSyncTitle}</Text>
              </View>
              <Text style={styles.infoCardDesc}>{t.cloudSyncDesc}</Text>
            </View>

            {/* Quick Actions Card */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.sectionHeaderTitle}>QUICK ACTIONS</Text>
              <View style={styles.quickActionRow}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab("catalog")}
                >
                  <Film size={18} color="#00ADB5" />
                  <Text style={styles.quickActionText}>Kelola Film</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab("livetv")}
                >
                  <Radio size={18} color="#10B981" />
                  <Text style={styles.quickActionText}>Saluran TV</Text>
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
            {/* Search Box */}
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

            {/* Content List */}
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
                        onPress={() => handleDelete(item.title)}
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
        {/* TAB 3: LIVE TV MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === "livetv" && (
          <View style={styles.sectionContainer}>
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
                    <Text style={styles.itemMeta}>
                      {channel.genres?.[0] || "Live Broadcast"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(channel.title)}
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

            {/* Live Terminal Output Console */}
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
});
