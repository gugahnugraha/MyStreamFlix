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
import { Play, Flame, Film, Tv, Radio, AlertCircle, Star } from "lucide-react-native";
import Header from "../components/Header";
import { Movie } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useMovies } from "../context/MovieContext";

const { width } = Dimensions.get("window");
const CARD_W = 120;
const CARD_H = 178;

export default function HomeScreen({ navigation }: any) {
  const { language, t } = useLanguage();
  const { movies, loading, error, refresh } = useMovies();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const nonLiveTv = movies.filter((m) => m.contentType !== "livetv" && !m.id.startsWith("tv-"));
  const allMovies = nonLiveTv.filter((m) => m.contentType === "movie" || !m.contentType);
  const allSeries = nonLiveTv.filter((m) => m.contentType === "series");
  const allLiveTv = movies.filter((m) => m.contentType === "livetv" || m.id.startsWith("tv-"));
  const heroItem = nonLiveTv.find((m) => m.backdropUrl) || nonLiveTv[0];

  const filteredMovies = (selectedCategory === "Live TV" ? movies : nonLiveTv).filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genres?.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (selectedCategory === "All") return true;
    if (selectedCategory === "Movies") return item.contentType === "movie" || !item.contentType;
    if (selectedCategory === "TV Series") return item.contentType === "series";
    if (selectedCategory === "Live TV") return item.contentType === "livetv" || item.id.startsWith("tv-");
    return item.genres?.some((g) => g.toLowerCase() === selectedCategory.toLowerCase());
  });

  const renderPosterCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Player", { movie: item, language })}
      activeOpacity={0.78}
    >
      <View style={styles.cardPosterWrapper}>
        <Image source={{ uri: item.posterUrl || item.backdropUrl }} style={styles.cardPoster} resizeMode="cover" />
        <View style={styles.cardQualityBadge}>
          <Text style={styles.cardQualityText}>{item.quality || "HD"}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardMeta}>{item.year || "2024"}</Text>
    </TouchableOpacity>
  );

  const renderChannelCard = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.channelCard}
      onPress={() => navigation.navigate("Player", { movie: item, language })}
      activeOpacity={0.78}
    >
      <Image source={{ uri: item.posterUrl || item.backdropUrl }} style={styles.channelPoster} resizeMode="cover" />
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <Text style={styles.channelTitle} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );

  const isFiltering = !!(searchQuery || selectedCategory !== "All");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080810" />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} colors={["#00ADB5"]} tintColor="#00ADB5" progressBackgroundColor="#1A1A22" />}
        >
          {/* Hero Banner */}
          {!isFiltering && heroItem && (
            <TouchableOpacity style={styles.heroContainer} onPress={() => navigation.navigate("Player", { movie: heroItem, language })} activeOpacity={0.9}>
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
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{heroItem.title}</Text>
                <View style={styles.heroMeta}>
                  <Star size={11} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.heroRating}>{(heroItem.rating || 8.5).toFixed(1)}</Text>
                  <Text style={styles.heroDot}>{"\u2022"}</Text>
                  <Text style={styles.heroYear}>{heroItem.year || "2024"}</Text>
                </View>
                <Text style={styles.heroDesc} numberOfLines={2}>{heroItem.description}</Text>
                <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate("Player", { movie: heroItem, language })}>
                  <Play size={15} color="#000" fill="#000" />
                  <Text style={styles.playBtnText}>{t.playNow}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {/* Filtered Grid or Category Sections */}
          {isFiltering ? (
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>
                {searchQuery ? `Hasil "${searchQuery}" (${filteredMovies.length})` : `${selectedCategory} (${filteredMovies.length})`}
              </Text>
              {filteredMovies.length === 0 ? (
                <View style={styles.emptyState}>
                  <Film size={40} color="#2A2A3A" />
                  <Text style={styles.emptyText}>Tidak ada hasil</Text>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {filteredMovies.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.gridCard} onPress={() => navigation.navigate("Player", { movie: item, language })} activeOpacity={0.78}>
                      <Image source={{ uri: item.posterUrl || item.backdropUrl }} style={styles.gridPoster} resizeMode="cover" />
                      {(item.contentType === "livetv" || item.id.startsWith("tv-")) && (
                        <View style={styles.liveBadge}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      )}
                      <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              {allMovies.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Film size={16} color="#00ADB5" />
                    <Text style={styles.sectionTitle}>{t.popularMovies}</Text>
                    <Text style={styles.sectionCount}>{allMovies.length}</Text>
                  </View>
                  <FlatList horizontal data={allMovies} renderItem={renderPosterCard} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent} />
                </View>
              )}

              {allSeries.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Tv size={16} color="#00ADB5" />
                    <Text style={styles.sectionTitle}>{t.popularSeries}</Text>
                    <Text style={styles.sectionCount}>{allSeries.length}</Text>
                  </View>
                  <FlatList horizontal data={allSeries} renderItem={renderPosterCard} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent} />
                </View>
              )}

              {allLiveTv.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Radio size={16} color="#FF4444" />
                    <Text style={styles.sectionTitle}>{t.liveTv}</Text>
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveIndText}>LIVE</Text>
                    </View>
                  </View>
                  <FlatList horizontal data={allLiveTv} renderItem={renderChannelCard} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent} />
                </View>
              )}

              {movies.length === 0 && !loading && (
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
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,68,68,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,68,68,0.35)" },
  heroBadgeText: { color: "#FF4444", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heroQualBadge: { backgroundColor: "rgba(0,173,181,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "rgba(0,173,181,0.35)" },
  heroQualText: { color: "#00ADB5", fontSize: 10, fontWeight: "700" },
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
  cardTitle: { color: "#EEE", fontSize: 11, fontWeight: "700", marginTop: 7, lineHeight: 15 },
  cardMeta: { color: "#666", fontSize: 10, marginTop: 2 },
  channelCard: { width: 130, position: "relative" },
  channelPoster: { width: 130, height: 80, borderRadius: 10, backgroundColor: "#141420" },
  liveBadge: { position: "absolute", top: 7, left: 7, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(220,30,30,0.88)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#FFF" },
  liveText: { color: "#FFF", fontSize: 8, fontWeight: "900" },
  channelTitle: { color: "#DDD", fontSize: 11, fontWeight: "600", marginTop: 6 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(220,30,30,0.12)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: "rgba(220,30,30,0.3)" },
  liveIndText: { color: "#FF3333", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  filterSection: { padding: 16 },
  filterTitle: { color: "#FFF", fontSize: 14, fontWeight: "800", marginBottom: 16 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  gridCard: { width: (width - 42) / 3, marginBottom: 10 },
  gridPoster: { width: "100%", height: 145, borderRadius: 10, backgroundColor: "#141420" },
  gridTitle: { color: "#DDD", fontSize: 10, fontWeight: "600", marginTop: 5, lineHeight: 14 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  emptyText: { color: "#444", fontSize: 14, fontWeight: "700" },
  emptySubtext: { color: "#333", fontSize: 11 },
});