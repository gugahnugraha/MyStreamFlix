import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Play, Flame, Film, Tv, AlertCircle, Star, Lock } from "lucide-react-native";
import Header from "../components/Header";
import AuthGateModal from "../components/AuthGateModal";
import { Movie } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useMovies } from "../context/MovieContext";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const CARD_W = 120;
const CARD_H = 178;

export default function HomeScreen({ navigation }: any) {
  const { language, t } = useLanguage();
  const { movies, loading, error, refresh } = useMovies();
  const { isLoggedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [pendingMovie, setPendingMovie] = useState<Movie | null>(null);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  /** Intercept navigation to Player — require auth */
  const navigateToPlayer = useCallback((movie: Movie) => {
    if (!isLoggedIn) {
      setPendingMovie(movie);
      setShowAuthGate(true);
      return;
    }
    navigation.navigate("Player", { movie, language });
  }, [isLoggedIn, navigation, language]);

  // Only movies & series (NO Live TV on this page)
  const catalogMovies = movies.filter(
    (m) => m.contentType !== "livetv" && !m.id.startsWith("tv-")
  );
  const allMovies = catalogMovies.filter((m) => m.contentType === "movie" || !m.contentType);
  const allSeries = catalogMovies.filter((m) => m.contentType === "series");
  const heroItem = catalogMovies.find((m) => m.backdropUrl) || catalogMovies[0];

  // Categories only cover movies & series
  const filteredMovies = catalogMovies.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (selectedCategory === "All") return true;
    if (selectedCategory === "Movies") return item.contentType === "movie" || !item.contentType;
    if (selectedCategory === "TV Series") return item.contentType === "series";
    return item.genres?.some((g) => g.toLowerCase() === selectedCategory.toLowerCase());
  });

  const renderPosterCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigateToPlayer(item)}
      activeOpacity={0.78}
    >
      <View style={styles.cardPosterWrapper}>
        <Image source={{ uri: item.posterUrl || item.backdropUrl }} style={styles.cardPoster} resizeMode="cover" />
        <View style={styles.cardQualityBadge}>
          <Text style={styles.cardQualityText}>{item.quality || "HD"}</Text>
        </View>
        {!isLoggedIn && (
          <View style={styles.cardLockOverlay}>
            <Lock size={14} color="#FFF" />
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardMeta}>{item.year || "2024"}</Text>
    </TouchableOpacity>
  );

  const isFiltering = !!(searchQuery || selectedCategory !== "All");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080810" />
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={["All", "Movies", "TV Series", "Action", "Comedy", "Drama", "Sci-Fi", "Animation", "Horror"]}
      />

      {loading && !refreshing ? (
        <View style={styles.centeredBox}>
          <ActivityIndicator size="large" color="#00ADB5" />
          <Text style={styles.loadingText}>{t.loadingCatalog}</Text>
        </View>
      ) : error && movies.length === 0 ? (
        <View style={styles.centeredBox}>
          <AlertCircle size={48} color="#FF4444" />
          <Text style={styles.errorTitle}>Gagal Memuat</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onPullRefresh}
              colors={["#00ADB5"]}
              tintColor="#00ADB5"
              progressBackgroundColor="#1A1A22"
            />
          }
        >
          {/* Hero Banner — only when not filtering */}
          {!isFiltering && heroItem && (
            <TouchableOpacity
              style={styles.heroContainer}
              onPress={() => navigateToPlayer(heroItem)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: heroItem.backdropUrl || heroItem.posterUrl }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroOverlay}>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroBadge}>
                    <Flame size={11} color="#FF4444" />
                    <Text style={styles.heroBadgeText}>TRENDING</Text>
                  </View>
                  {heroItem.quality && (
                    <View style={styles.heroQualBadge}>
                      <Text style={styles.heroQualText}>{heroItem.quality}</Text>
                    </View>
                  )}
                  {!isLoggedIn && (
                    <View style={styles.heroLockBadge}>
                      <Lock size={10} color="#FFD700" />
                      <Text style={styles.heroLockText}>LOGIN UNTUK TONTON</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{heroItem.title}</Text>
                <View style={styles.heroMeta}>
                  <Star size={11} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.heroRating}>{(heroItem.rating || 8.5).toFixed(1)}</Text>
                  <Text style={styles.heroDot}>{"\u2022"}</Text>
                  <Text style={styles.heroYear}>{heroItem.year || "2024"}</Text>
                </View>
                <Text style={styles.heroDesc} numberOfLines={2}>{heroItem.description}</Text>
                <TouchableOpacity style={styles.playBtn} onPress={() => navigateToPlayer(heroItem)}>
                  {isLoggedIn ? (
                    <Play size={15} color="#000" fill="#000" />
                  ) : (
                    <Lock size={15} color="#000" />
                  )}
                  <Text style={styles.playBtnText}>{isLoggedIn ? t.playNow : "Login untuk Tonton"}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {/* Filtered Grid or Sections */}
          {isFiltering ? (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>
                {searchQuery
                  ? `Hasil "${searchQuery}" (${filteredMovies.length})`
                  : `${selectedCategory} (${filteredMovies.length})`}
              </Text>
              {filteredMovies.length === 0 ? (
                <View style={styles.emptyState}>
                  <Film size={40} color="#2A2A3A" />
                  <Text style={styles.emptyText}>Tidak ada hasil</Text>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {filteredMovies.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.gridCard}
                      onPress={() => navigateToPlayer(item)}
                      activeOpacity={0.78}
                    >
                      <View style={{ position: "relative" }}>
                        <Image source={{ uri: item.posterUrl || item.backdropUrl }} style={styles.gridPoster} resizeMode="cover" />
                        {!isLoggedIn && (
                          <View style={styles.gridLockOverlay}>
                            <Lock size={16} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Movies Section */}
              {allMovies.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Film size={16} color="#00ADB5" />
                    <Text style={styles.sectionTitle}>{t.popularMovies}</Text>
                    <Text style={styles.sectionCount}>{allMovies.length}</Text>
                  </View>
                  <FlatList
                    horizontal
                    data={allMovies}
                    renderItem={renderPosterCard}
                    keyExtractor={(i) => i.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rowContent}
                  />
                </View>
              )}

              {/* Series Section */}
              {allSeries.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Tv size={16} color="#00ADB5" />
                    <Text style={styles.sectionTitle}>{t.popularSeries}</Text>
                    <Text style={styles.sectionCount}>{allSeries.length}</Text>
                  </View>
                  <FlatList
                    horizontal
                    data={allSeries}
                    renderItem={renderPosterCard}
                    keyExtractor={(i) => i.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rowContent}
                  />
                </View>
              )}

              {/* Login CTA banner when not logged in */}
              {!isLoggedIn && catalogMovies.length > 0 && (
                <TouchableOpacity
                  style={styles.loginCtaBanner}
                  onPress={() => setShowAuthGate(true)}
                  activeOpacity={0.85}
                >
                  <Lock size={18} color="#00ADB5" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.loginCtaTitle}>Login untuk menonton</Text>
                    <Text style={styles.loginCtaDesc}>Buat akun gratis atau masuk untuk streaming semua konten.</Text>
                  </View>
                  <View style={styles.loginCtaBtn}>
                    <Text style={styles.loginCtaBtnText}>Masuk</Text>
                  </View>
                </TouchableOpacity>
              )}

              {catalogMovies.length === 0 && !loading && (
                <View style={styles.emptyState}>
                  <Film size={56} color="#1A1A2A" />
                  <Text style={styles.emptyText}>Belum ada konten</Text>
                  <Text style={styles.emptySubtext}>Tarik ke bawah untuk refresh</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* Auth Gate Modal */}
      <AuthGateModal
        visible={showAuthGate}
        onClose={() => { setShowAuthGate(false); setPendingMovie(null); }}
        reason="Login diperlukan untuk menonton film dan serial."
        onAuthSuccess={() => {
          setShowAuthGate(false);
          if (pendingMovie) {
            navigation.navigate("Player", { movie: pendingMovie, language });
            setPendingMovie(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080810" },
  scroll: { flex: 1 },
  centeredBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, paddingHorizontal: 32 },
  loadingText: { color: "#888", fontSize: 13, fontWeight: "600" },
  errorTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  errorMsg: { color: "#888", fontSize: 12, textAlign: "center", lineHeight: 18 },
  retryBtn: { backgroundColor: "#00ADB5", paddingVertical: 10, paddingHorizontal: 28, borderRadius: 20, marginTop: 8 },
  retryText: { color: "#000", fontWeight: "800", fontSize: 13 },
  heroContainer: { width, height: 370, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 18, paddingBottom: 22, backgroundColor: "rgba(8,8,16,0.88)" },
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,68,68,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,68,68,0.35)" },
  heroBadgeText: { color: "#FF4444", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heroQualBadge: { backgroundColor: "rgba(0,173,181,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "rgba(0,173,181,0.35)" },
  heroQualText: { color: "#00ADB5", fontSize: 10, fontWeight: "700" },
  heroLockBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,215,0,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,215,0,0.35)" },
  heroLockText: { color: "#FFD700", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  heroTitle: { color: "#FFF", fontSize: 21, fontWeight: "900", marginBottom: 6, letterSpacing: -0.3 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  heroRating: { color: "#FFD700", fontSize: 12, fontWeight: "700" },
  heroDot: { color: "#555", fontSize: 12 },
  heroYear: { color: "#AAA", fontSize: 12, fontWeight: "500" },
  heroDesc: { color: "#999", fontSize: 12, lineHeight: 18, marginBottom: 14 },
  playBtn: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#00ADB5", paddingVertical: 10, paddingHorizontal: 22, borderRadius: 22, alignSelf: "flex-start" },
  playBtnText: { color: "#000", fontSize: 13, fontWeight: "800" },
  section: { marginTop: 26 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: "#FFF", fontSize: 15, fontWeight: "800", flex: 1 },
  sectionCount: { color: "#555", fontSize: 11, fontWeight: "600", backgroundColor: "#141420", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  rowContent: { paddingHorizontal: 16, gap: 12 },
  card: { width: CARD_W },
  cardPosterWrapper: { position: "relative" },
  cardPoster: { width: CARD_W, height: CARD_H, borderRadius: 10, backgroundColor: "#141420" },
  cardQualityBadge: { position: "absolute", top: 7, right: 7, backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: "rgba(0,173,181,0.5)" },
  cardQualityText: { color: "#00ADB5", fontSize: 8, fontWeight: "700" },
  cardLockOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 36, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  cardTitle: { color: "#EEE", fontSize: 11, fontWeight: "700", marginTop: 7, lineHeight: 15 },
  cardMeta: { color: "#666", fontSize: 10, marginTop: 2 },
  loginCtaBanner: { margin: 16, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#111820", borderWidth: 1, borderColor: "rgba(0,173,181,0.25)", borderRadius: 14, padding: 14 },
  loginCtaTitle: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  loginCtaDesc: { color: "#777", fontSize: 11, marginTop: 2, lineHeight: 15 },
  loginCtaBtn: { backgroundColor: "#00ADB5", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  loginCtaBtnText: { color: "#000", fontWeight: "800", fontSize: 12 },
  filterSection: { padding: 16 },
  filterTitle: { color: "#FFF", fontSize: 14, fontWeight: "800", marginBottom: 16 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  gridCard: { width: (width - 42) / 3, marginBottom: 10 },
  gridPoster: { width: "100%", height: 145, borderRadius: 10, backgroundColor: "#141420" },
  gridLockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", borderRadius: 10 },
  gridTitle: { color: "#DDD", fontSize: 10, fontWeight: "600", marginTop: 5, lineHeight: 14 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyText: { color: "#444", fontSize: 14, fontWeight: "700" },
  emptySubtext: { color: "#333", fontSize: 11 },
});